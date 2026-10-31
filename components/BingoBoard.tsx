"use client";

import { useEffect, useState, useRef } from "react";
import { toBlob } from "html-to-image";

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

const initialProgress: Progress = {
  board1: Array(9).fill(false),
  board2: Array(9).fill(false),
};

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

//main app

export default function BingoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  // current board
  const [selectedBoard, setSelectedBoard] =
    useState<BoardId | null>(null);

  // progress
  const [progress, setProgress] = 
    useState<Progress>(initialProgress);

  // load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);

        // load checks
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
          setProgress(parsed as Progress); //set progress
        }
      } catch {
        console.error("Error loading past progress");
      }
    }
  }, []);

  // on change save progress
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );
  }, [progress]);

  // toggle squares
  function toggleSquare(index: number) {
    if (!selectedBoard) return;

    setProgress((prev) => ({
      ...prev,
      [selectedBoard]: prev[selectedBoard].map(
        (value, i) => (i === index ? !value : value)
      ),
    }));
  }

  // reset current board
  function resetBoard() {
    if (!selectedBoard) return;

    setProgress((prev) => ({
      ...prev,
      [selectedBoard]: Array(9).fill(false),
    }));
  }

  // return to board selection
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
        backgroundColor: "#10251B",
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
        "Screenshot copied! Send it to the frog discord server to report your weekly results and add them to the leaderboards."
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
      <main className="min-h-screen bg-[#10251B] flex flex-col items-center justify-center p-6">

        <h1 className="text-3xl font-bold mb-3">
          🐸 frog Weekly Bingo
        </h1>

        <p className="text-gray-50 mb-8 justify-center">
          Complete tasks in 2 weekly bingo boards to earn points for the leaderboards. Complete 3 tasks in a line to earn 1 point. Clear the board for 2 bonus points - totaling 10 points per board.
        </p>
        <p className="text-gray-50 mb-8 justify-center">
          Select a board:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">

          {(Object.keys(boards) as BoardId[]).map((id) => { //list boards - create button
            //number of completed tasks in board
            const completed = progress[id].filter(Boolean).length;

            return (
              <button
                key={id}
                onClick={() => setSelectedBoard(id)}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  completed === 9
                    ? "bg-indigo-500 border-[#ffd700] hover:border-indigo-200"
                    : "bg-green-100 border-green-800 hover:border-indigo-500 hover:bg-green-200"
                }`}
              >
                <h2 className={`"text-xl font-bold mb-2 ${
                  completed === 9 ? "text-indigo-800" : "text-gray-600"
                }`}>
                  {boards[id].title}
                </h2>

                <p className="text-sm text-gray-400 mb-4">
                  {boards[id].description}
                </p>

                <p className={`text-sm font-medium ${
                  completed === 9 ? "text-[#ffd700]" : "text-indigo-600"
                }`}>
                  {completed}/9 squares completed
                </p>
              </button>

            );
          })}

        </div>
      </main>
    );
  }

  //current board data
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
    <main className="min-h-screen bg-[#10251B] flex flex-col items-center justify-center p-4 sm:p-6">

      {/* Navigation */}
      <button
        onClick={backToSelection}
        className="mb-6 text-sm text-gray-50 hover:text-indigo-600"
      >
        ← Back to boards 🐸
      </button>

      {/*Screenshot Area */}
      <div 
        ref={boardRef}
        className="w-full max-w-[640px] bg-[#10251B] p-4 sm:p-6 rounded-x1"
      >

      {/* Title */}
      <h1 className="text-2xl sm:text-3x1 font-bold mb-6 text-center">
        {boards[selectedBoard].title}
      </h1>

      {/* Score counter */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-50 font-medium">
          SCORE
        </p>

        <p className="text-4xl font-black">
          {score}
        </p>

        <p className="text-sm text-gray-50 mt-2">
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
            w-full aspect-square min-w-0
            box-border overflow-hidden
            rounded-lg sm:rounded-xl
            p-1 sm:p-2
            flex items-center justify-center
            text-center
            border-2 transition-colors
            ${
              selected[index]
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-800 border-gray-200 hover:border-indigo-400"
            }
          `}
        >
          <span
            className="
              block w-full
              text-[clamp(9px,2.5vw,16px)]
              leading-tight
              font-semibold
              text-center
              break-words
              overflow-hidden
            "
          >
            {task}
          </span>
        </button>
      ))}

      </div>

      {/* Completion message */}
      {boardCompleted && (
        <p className="mt-5 text-base sm:text-lg font-bold text-indigo-600 text-center">
          🐸 Bingo! Board completed! 🐸
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
          {copying ? "Copying..." : "📸📋 Copy Screenshot"}
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
