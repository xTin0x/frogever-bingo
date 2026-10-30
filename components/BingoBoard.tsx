

"use client";

import { useEffect, useState, useRef } from "react";
import { toBlob } from "html-to-image";

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
  const boardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

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

  // Copy screenshot to clipboard
  async function copyScreenshot() {
    if (!boardRef.current) return;

    try {
      setCopying(true);
      setCopyMessage("");

      // Generate screenshot as PNG
      const blob = await toBlob(boardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#f9fafb",
        cacheBust: true,
      });

      if (!blob) {
        throw new Error("Could not generate screenshot.");
      }

      // Check clipboard support
      if (
        !navigator.clipboard ||
        typeof ClipboardItem === "undefined"
      ) {
        throw new Error(
          "Image clipboard is not supported by this browser."
        );
      }

      // Copy image to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setCopyMessage(
        "Screenshot copied! Paste it wherever you like. 🎉"
      );
    } catch (error) {
      console.error("Screenshot copy failed:", error);

      setCopyMessage(
        "Could not copy screenshot. Check browser permissions."
      );
    } finally {
      setCopying(false);
    }
  }

  // Board selection screen
  if (!selectedBoard) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

        <h1 className="text-3xl font-bold mb-3">
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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">

      {/* Navigation */}
      <button
        onClick={backToSelection}
        className="mb-6 text-sm text-gray-500 hover:text-indigo-600"
      >
        ← Back to boards
      </button>

      {/*Screenshot Area */}
      <div 
        ref={boardRef}
        className="w-full max-w-[640px] bg-gray-50 p-4 sm:p-6 rounded-x1"
      >

      {/* Title */}
      <h1 className="text-2xl sm:text-3x1 font-bold mb-6 text-center">
        {boards[selectedBoard].title}
      </h1>

      {/* Score counter */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-500 font-medium">
          SCORE
        </p>

        <p className="text-4xl font-black">
          {score}
        </p>

        <p className="text-sm text-gray-500 mt-2">
          {completedLines} completed lines
          {boardCompleted && " + 2 bonus points"}
        </p>
      </div>

      {/* Bingo grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">

        {tasks.map((task, index) => (
          <button
            key={index}
            onClick={() => toggleSquare(index)}
            aria-pressed={selected[index]}
            className={`
        w-full aspect-[1/1] min-w-0 min-h-0
        box-border overflow-hidden
        rounded-lg sm:rounded-xl
        p-2
        flex items-center justify-center
        text-center text-xs sm:text-sm
        font-semibold
        border-2 transition-colors
        ${
          selected[index]
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white text-gray-800 border-gray-200 hover:border-indigo-400"
        }
      `}
    >
      <span className="w-full break-words leading-tight">
        {task}
      </span>
          </button>
        ))}

      </div>

      {/* Completion message */}
      {boardCompleted && (
        <p className="mt-5 text-base sm:text-lg font-bold text-indigo-600 text-center">
          🎉 Bingo! Board completed!
        </p>
      )}
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-[640px] flex flex-col gap-3 mt-6">

        {/* Reset button */}
        <button
          onClick={resetBoard}
          className="w-full px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
        >
          Reset Board
        </button>

        {/* Copy screenshot button */}
        <button
          onClick={copyScreenshot}
          disabled={copying}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {copying ? "Copying..." : "📋 Copy Screenshot"}
        </button>

        {/* Copy status */}
        {copyMessage && (
          <p className="text-sm text-center text-gray-600">
            {copyMessage}
          </p>
        )}

      </div>

    </main>
  );
}
