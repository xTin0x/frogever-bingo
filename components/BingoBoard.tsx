

"use client";

import { useEffect, useState } from "react";

// Define the two Bingo boards
const boards = {
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
};

type BoardId = keyof typeof boards;

type Progress = Record<BoardId, boolean[]>;

const STORAGE_KEY = "bingo-progress";

const points: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const initialProgress: Progress = {
  board1: Array(9).fill(false),
  board2: Array(9).fill(false),
};

export default function BingoBoard() {
  // Currently selected board
  const [selectedBoard, setSelectedBoard] =
    useState<BoardId | null>(null);

  // Progress for both boards
  const [progress, setProgress] =
    useState<Progress>(initialProgress);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);

        if (
          parsed !== null &&
          typeof parsed === "object" &&
          "board1" in parsed &&
          "board2" in parsed &&
          Array.isArray(parsed.board1) &&
          Array.isArray(parsed.board2) &&
          parsed.board1.length === 9 &&
          parsed.board2.length === 9 &&
          [...parsed.board1, ...parsed.board2].every(
            (value) => typeof value === "boolean"
          )
        ) {
          setProgress(parsed as Progress);
        }
      } catch {
        console.error("Error loading past progress");
      }
    }
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );
  }, [progress]);

  // Toggle a square on the active board
  function toggleSquare(index: number) {
    if (!selectedBoard) return;

    setProgress((prev) => ({
      ...prev,
      [selectedBoard]: prev[selectedBoard].map(
        (value, i) => (i === index ? !value : value)
      ),
    }));
  }

  // Reset only the active board
  function resetBoard() {
    if (!selectedBoard) return;

    setProgress((prev) => ({
      ...prev,
      [selectedBoard]: Array(9).fill(false),
    }));
  }

  // Return to board selection
  function backToSelection() {
    setSelectedBoard(null);
  }

  // Board selection screen
  if (!selectedBoard) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

        <h1 className="text-3xl-green-800 font-bold mb-3">
          frog Weekly Bingo
        </h1>

        <p className="text-gray-500 mb-8">
          Choose a board to see tasks. Complete all the tasks in a line/column/diagonal to earn points. Clear the board for bonus points.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">

          {(Object.keys(boards) as BoardId[]).map((id) => {
            const completed = progress[id].filter(Boolean).length;

            return (
              <button
                key={id}
                onClick={() => setSelectedBoard(id)}
                className="p-6 bg-white border-2 border-green-800 rounded-xl text-left hover:border-indigo-500 transition-all"
              >
                <h2 className="text-xl font-bold mb-2">
                  {boards[id].title}
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                  {boards[id].description}
                </p>

                <p className="text-sm font-medium text-indigo-600">
                  {completed}/9 squares completed
                </p>
              </button>
            );
          })}

        </div>
      </main>
    );
  }

  // Active board data
  const tasks = boards[selectedBoard].tasks;
  const selected = progress[selectedBoard];

  // Calculate completed lines
  const completedLines = points.filter((line) =>
    line.every((index) => selected[index])
  ).length;

  // Check full board completion
  const boardCompleted = selected.every(Boolean);

  // Calculate score
  const score = completedLines + (boardCompleted ? 2 : 0);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

      {/* Navigation */}
      <button
        onClick={backToSelection}
        className="mb-6 text-sm text-gray-500 hover:text-indigo-600"
      >
        ← Back to boards
      </button>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">
        {boards[selectedBoard].title}
      </h1>

      {/* Score counter */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-500 font-medium">
          SCORE
        </p>

        <p className="text-5xl font-black">
          {score}
        </p>

        <p className="text-sm text-gray-500 mt-2">
          {completedLines} completed lines
          {boardCompleted && " + 2 bonus points"}
        </p>
      </div>

      {/* Bingo grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">

        {tasks.map((task, index) => (
          <button
            key={index}
            onClick={() => toggleSquare(index)}
            aria-pressed={selected[index]}
            className={`
              aspect-square rounded-xl p-3
              flex items-center justify-center
              text-sm sm:text-base font-semibold
              border-2 transition-all
              ${
                selected[index]
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-800 border-gray-200 hover:border-indigo-400"
              }
            `}
          >
            {task}
          </button>
        ))}

      </div>

      {/* Completion message */}
      {boardCompleted && (
        <p className="mt-5 text-lg font-bold text-indigo-600">
          🎉 Bingo! Board completed!
        </p>
      )}

      {/* Reset button */}
      <button
        onClick={resetBoard}
        className="mt-6 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
      >
        Reset Board
      </button>

    </main>
  );
}
