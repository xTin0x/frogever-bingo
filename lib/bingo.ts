export const boards = {
  board1: {
    title: "Guild Contribution",
    description: "Help other frogs and contribute to the guild bank",
  },

  board2: {
    title: "Personal Progression",
    description: "Milestones for your personal progression",
  },
} as const;

export type BoardId = keyof typeof boards;
export type BoardTasks = Record<BoardId, string[]>;

export type Progress = Record<BoardId, boolean[]>;

export const STORAGE_KEY = "bingo-progress";
export const FIRST_WEEK_ID = "2026-11-04";

const WEEK_LENGTH_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_PREVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;
const WEEK_START_ANCHOR_MS = Date.parse("2026-11-04T23:00:00.000Z");

export const initialProgress: Progress = {
  board1: Array(9).fill(false),
  board2: Array(9).fill(false),
};

const lines: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function completedLineCount(selected: boolean[]): number {
  return lines.filter((line) => line.every((index) => selected[index])).length;
}

export function boardScore(selected: boolean[]): number {
  const completedLines = completedLineCount(selected);
  const boardCompleted = selected.every(Boolean);
  return completedLines + (boardCompleted ? 2 : 0);
}

export function isBoardProgress(value: unknown): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    value.every((item) => typeof item === "boolean")
  );
}

export function isProgress(value: unknown): value is Progress {
  return (
    value !== null &&
    typeof value === "object" &&
    isBoardProgress((value as Progress).board1) &&
    isBoardProgress((value as Progress).board2)
  );
}

export function isBoardTasks(value: unknown): value is BoardTasks {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.values(value as Record<string, unknown>).length === 2 &&
    (Object.keys(boards) as BoardId[]).every((boardId) => {
      const tasks = (value as Record<BoardId, unknown>)[boardId];
      return (
        Array.isArray(tasks) &&
        tasks.length === 9 &&
        tasks.every((task) => typeof task === "string" && task.trim().length > 0)
      );
    })
  );
}

export function isWeekId(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T23:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && getWeekId(date) === value;
}

/**
 * Dev weeks start every seven days from Nov 4, 2026 at 23:00 GMT.
 */
export function getWeekId(now = new Date()): string {
  const periodsSinceAnchor = Math.max(
    0,
    Math.floor((now.getTime() - WEEK_START_ANCHOR_MS) / WEEK_LENGTH_MS)
  );
  return new Date(
    WEEK_START_ANCHOR_MS + periodsSinceAnchor * WEEK_LENGTH_MS
  )
    .toISOString()
    .slice(0, 10);
}

export function isWeekStarted(weekId: string, now = new Date()): boolean {
  return now.getTime() >= getWeekStartTime(weekId);
}

export function isWeekReadable(weekId: string, now = new Date()): boolean {
  const currentWeekId = getWeekId(now);
  if (weekId <= currentWeekId) return true;

  return (
    weekId === addWeeks(currentWeekId, 1) &&
    now.getTime() >= getWeekStartTime(weekId) - WEEK_PREVIEW_WINDOW_MS
  );
}

function getWeekStartTime(weekId: string): number {
  return Date.parse(`${weekId}T23:00:00.000Z`);
}

export function formatWeekStartLabel(weekId: string): string {
  const date = new Date(getWeekStartTime(weekId));
  if (Number.isNaN(date.getTime())) return weekId;

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function addWeeks(weekId: string, amount: number): string {
  const date = new Date(`${weekId}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount * 7);
  return date.toISOString().slice(0, 10);
}

export function formatWeekLabel(weekId: string): string {
  const date = new Date(`${weekId}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return weekId;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
