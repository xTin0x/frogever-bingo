import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/env";
import {
  addWeeks,
  FIRST_WEEK_ID,
  type BoardTasks,
  type Progress,
} from "@/lib/bingo";
import { defaultBoardTasks } from "@/lib/default-boards";

const DEFAULT_BOARD_SEED_VERSION = "numeric-v1";

export type WeeklyScore = {
  discord_user_id: string;
  discord_username: string;
  discord_display_name: string;
  week_id: string;
  board1_score: number;
  board2_score: number;
  total_score: number;
  board1_progress: boolean[];
  board2_progress: boolean[];
  created_at: string;
  updated_at: string;
};

export type WeeklyBoard = {
  week_id: string;
  board1_tasks: string[];
  board2_tasks: string[];
  created_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  discordUserId: string;
  displayName: string;
  username: string;
  lifetimeTotal: number;
  board1TasksCompleted: number;
  board2TasksCompleted: number;
  firstSubmittedAt: string;
  weeks: Array<{
    weekId: string;
    board1Score: number;
    board2Score: number;
    totalScore: number;
    submittedAt: string;
  }>;
};

let schemaReady = false;

function sql() {
  return neon(getDatabaseUrl());
}

export async function ensureSchema() {
  if (schemaReady) return;
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS weekly_scores (
      id BIGSERIAL PRIMARY KEY,
      discord_user_id TEXT NOT NULL,
      discord_username TEXT NOT NULL,
      discord_display_name TEXT NOT NULL,
      week_id TEXT NOT NULL,
      board1_score INTEGER NOT NULL,
      board2_score INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      board1_progress JSONB NOT NULL,
      board2_progress JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (discord_user_id, week_id)
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS weekly_boards (
      week_id TEXT PRIMARY KEY,
      board1_tasks JSONB NOT NULL,
      board2_tasks JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    ALTER TABLE weekly_boards
    ADD COLUMN IF NOT EXISTS seed_version TEXT NOT NULL DEFAULT ''
  `;
  for (const weekId of [FIRST_WEEK_ID, addWeeks(FIRST_WEEK_ID, 1)]) {
    await db`
      INSERT INTO weekly_boards (
        week_id,
        board1_tasks,
        board2_tasks,
        seed_version
      )
      VALUES (
        ${weekId},
        ${JSON.stringify(defaultBoardTasks.board1)}::jsonb,
        ${JSON.stringify(defaultBoardTasks.board2)}::jsonb,
        ${DEFAULT_BOARD_SEED_VERSION}
      )
      ON CONFLICT (week_id)
      DO UPDATE SET
        board1_tasks = EXCLUDED.board1_tasks,
        board2_tasks = EXCLUDED.board2_tasks,
        seed_version = EXCLUDED.seed_version
      WHERE weekly_boards.seed_version = ''
    `;
  }
  schemaReady = true;
}

export async function getWeeklyBoard(weekId: string): Promise<WeeklyBoard | null> {
  await ensureSchema();
  const rows = await sql()`
    SELECT week_id, board1_tasks, board2_tasks, created_at, updated_at
    FROM weekly_boards
    WHERE week_id = ${weekId}
    LIMIT 1
  `;
  return (rows[0] as WeeklyBoard | undefined) ?? null;
}

export async function saveWeeklyBoard(input: {
  weekId: string;
  tasks: BoardTasks;
}): Promise<WeeklyBoard> {
  await ensureSchema();
  const rows = await sql()`
    INSERT INTO weekly_boards (
      week_id,
      board1_tasks,
      board2_tasks,
      seed_version
    )
    VALUES (
      ${input.weekId},
      ${JSON.stringify(input.tasks.board1)}::jsonb,
      ${JSON.stringify(input.tasks.board2)}::jsonb,
      'manual'
    )
    ON CONFLICT (week_id)
    DO UPDATE SET
      board1_tasks = EXCLUDED.board1_tasks,
      board2_tasks = EXCLUDED.board2_tasks,
      seed_version = 'manual',
      updated_at = NOW()
    RETURNING week_id, board1_tasks, board2_tasks, created_at, updated_at
  `;
  return rows[0] as WeeklyBoard;
}

export async function getWeeklyScore(
  discordUserId: string,
  weekId: string
): Promise<WeeklyScore | null> {
  await ensureSchema();
  const rows = await sql()`
    SELECT
      discord_user_id,
      discord_username,
      discord_display_name,
      week_id,
      board1_score,
      board2_score,
      total_score,
      board1_progress,
      board2_progress,
      created_at,
      updated_at
    FROM weekly_scores
    WHERE discord_user_id = ${discordUserId} AND week_id = ${weekId}
    LIMIT 1
  `;
  return (rows[0] as WeeklyScore | undefined) ?? null;
}

export async function getLifetimeTotal(discordUserId: string): Promise<number> {
  await ensureSchema();
  const rows = await sql()`
    SELECT COALESCE(SUM(total_score), 0)::INTEGER AS lifetime_total
    FROM weekly_scores
    WHERE discord_user_id = ${discordUserId}
  `;
  return Number(rows[0]?.lifetime_total ?? 0);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  await ensureSchema();
  const rows = await sql()`
    SELECT
      discord_user_id,
      discord_username,
      discord_display_name,
      week_id,
      board1_score,
      board2_score,
      total_score,
      board1_progress,
      board2_progress,
      created_at
    FROM weekly_scores
    ORDER BY created_at ASC
  `;

  const entries = new Map<string, LeaderboardEntry>();
  for (const row of rows as Array<{
    discord_user_id: string;
    discord_username: string;
    discord_display_name: string;
    week_id: string;
    board1_score: number;
    board2_score: number;
    total_score: number;
    board1_progress: unknown;
    board2_progress: unknown;
    created_at: string;
  }>) {
    const submittedAt = String(row.created_at);
    const existing = entries.get(row.discord_user_id);
    const entry = existing ?? {
      discordUserId: row.discord_user_id,
      displayName: row.discord_display_name,
      username: row.discord_username,
      lifetimeTotal: 0,
      board1TasksCompleted: 0,
      board2TasksCompleted: 0,
      firstSubmittedAt: submittedAt,
      weeks: [],
    };

    entry.displayName = row.discord_display_name;
    entry.username = row.discord_username;
    entry.lifetimeTotal += Number(row.total_score);
    entry.board1TasksCompleted += countCompletedTasks(row.board1_progress);
    entry.board2TasksCompleted += countCompletedTasks(row.board2_progress);
    entry.weeks.push({
      weekId: row.week_id,
      board1Score: Number(row.board1_score),
      board2Score: Number(row.board2_score),
      totalScore: Number(row.total_score),
      submittedAt,
    });
    entries.set(row.discord_user_id, entry);
  }

  return [...entries.values()]
    .sort(
      (left, right) =>
        right.lifetimeTotal - left.lifetimeTotal ||
        right.board1TasksCompleted +
          right.board2TasksCompleted -
          (left.board1TasksCompleted + left.board2TasksCompleted) ||
        left.firstSubmittedAt.localeCompare(right.firstSubmittedAt)
    )
    .map((entry) => ({
      ...entry,
      weeks: entry.weeks.sort((left, right) =>
        left.weekId.localeCompare(right.weekId)
      ),
    }));
}

function countCompletedTasks(progress: unknown): number {
  return Array.isArray(progress) ? progress.filter(Boolean).length : 0;
}

export async function upsertWeeklyScore(input: {
  discordUserId: string;
  username: string;
  displayName: string;
  weekId: string;
  board1Score: number;
  board2Score: number;
  totalScore: number;
  progress: Progress;
}): Promise<{ score: WeeklyScore; updated: boolean }> {
  await ensureSchema();
  const existing = await getWeeklyScore(input.discordUserId, input.weekId);
  const rows = await sql()`
    INSERT INTO weekly_scores (
      discord_user_id,
      discord_username,
      discord_display_name,
      week_id,
      board1_score,
      board2_score,
      total_score,
      board1_progress,
      board2_progress
    )
    VALUES (
      ${input.discordUserId},
      ${input.username},
      ${input.displayName},
      ${input.weekId},
      ${input.board1Score},
      ${input.board2Score},
      ${input.totalScore},
      ${JSON.stringify(input.progress.board1)}::jsonb,
      ${JSON.stringify(input.progress.board2)}::jsonb
    )
    ON CONFLICT (discord_user_id, week_id)
    DO UPDATE SET
      discord_username = EXCLUDED.discord_username,
      discord_display_name = EXCLUDED.discord_display_name,
      board1_score = EXCLUDED.board1_score,
      board2_score = EXCLUDED.board2_score,
      total_score = EXCLUDED.total_score,
      board1_progress = EXCLUDED.board1_progress,
      board2_progress = EXCLUDED.board2_progress,
      updated_at = NOW()
    RETURNING
      discord_user_id,
      discord_username,
      discord_display_name,
      week_id,
      board1_score,
      board2_score,
      total_score,
      board1_progress,
      board2_progress,
      created_at,
      updated_at
  `;

  return {
    score: rows[0] as WeeklyScore,
    updated: existing !== null,
  };
}
