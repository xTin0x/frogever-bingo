export const boards = {
  board1: {
    title: "Guild Contribution",
    description: "Help other frogs and contribute to the guild bank",
    tasks: [
      "Trade with a guildie or deposit in guild bank 1 item crafted/acquired through one of your primary professions",
      "Make a 50s contribution to the guild bank fund",
      "Trade with a guildie or deposit in guild bank 1 item crafted/acquired through one of your secondary professions",
      "Trade with a guildie or deposit in guild bank 1 item crafted/acquired through one of your secondary professions",
      "Trade with a guildie or deposit in guild bank 1 item crafted/acquired through one of your primary professions",
      "Make a 50s contribution to the guild bank fund",
      "Trade with a guildie or deposit in guild bank 1 item crafted/acquired through one of your primary professions",
      "Make a 50s contribution to the guild bank fund",
      "Trade with a guildie or deposit in guild bank 1 item crafted/acquired through one of your primary professions",
    ],
  },

  board2: {
    title: "Personal Progression",
    description: "Milestones for your personal progression",
    tasks: [
      "Equip a Blue Item",
      "Reach Level 50 in 1 primary profession",
      "Reach Level 50 in 2 primary professions",
      "Reach Level 10",
      "Reach Level 15",
      "Reach Level 20",
      "Complete 30 quests",
      "Clear any dungeon",
      "Reach Level 50 in any secondary profession (First Aid/Cooking/Fishing)",
    ],
  },
} as const;

export type BoardId = keyof typeof boards;

export type Progress = Record<BoardId, boolean[]>;

export const STORAGE_KEY = "bingo-progress";

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

/**
 * Guild week starts Tuesday 00:00 UTC (classic WoW reset day).
 */
export function getWeekId(now = new Date()): string {
  const utc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const day = utc.getUTCDay();
  const daysSinceTuesday = (day + 5) % 7;
  utc.setUTCDate(utc.getUTCDate() - daysSinceTuesday);
  return utc.toISOString().slice(0, 10);
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
