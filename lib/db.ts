import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/env";
import type { Progress } from "@/lib/bingo";

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
  schemaReady = true;
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
