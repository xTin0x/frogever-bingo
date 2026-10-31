"use client";

import { useEffect, useState, useRef } from "react";
import { toBlob } from "html-to-image";
import WeeklySubmit from "@/components/WeeklySubmit";
import {
  boards,
  boardScore,
  completedLineCount,
  initialProgress,
  isProgress,
  STORAGE_KEY,
  type BoardId,
  type Progress,
} from "@/lib/bingo";

export default function BingoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<BoardId | null>(null);
  const [progress, setProgress] = useState<Progress>(initialProgress);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (isProgress(parsed)) {
          // Restore client-only saved checks after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR
          setProgress(parsed);
        }
      } catch {
        console.error("Error loading past progress");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  function toggleSquare(index: number) {
    if (!selectedBoard) return;

    setProgress((prev) => ({
      ...prev,
      [selectedBoard]: prev[selectedBoard].map((value, i) =>
        i === index ? !value : value
      ),
    }));
  }

  function resetBoard() {
    if (!selectedBoard) return;

    setProgress((prev) => ({
      ...prev,
      [selectedBoard]: Array(9).fill(false),
    }));
  }

  function backToSelection() {
    setSelectedBoard(null);
  }

  async function copyScreenshot() {
    if (!boardRef.current) return;

    try {
      setCopying(true);
      setCopyMessage("");

      const blob = await toBlob(boardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#10251B",
        cacheBust: true,
      });

      if (!blob) {
        throw new Error("Could not generate screenshot.");
      }

      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("Image clipboard is not supported by this browser.");
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setCopyMessage(
        "Screenshot copied. You can also submit scores from the board list if you are in the frog Discord."
      );
    } catch (error) {
      console.error("Screenshot copy failed:", error);
      setCopyMessage("Could not copy screenshot. Check browser permissions.");
    } finally {
      setCopying(false);
    }
  }

  if (!selectedBoard) {
    return (
      <main className="min-h-screen bg-[#10251B] flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-3">🐸 frog Weekly Bingo</h1>

        <p className="text-gray-50 mb-8 justify-center">
          Complete tasks in 2 weekly bingo boards to earn points for the
          leaderboards. Complete 3 tasks in a line to earn 1 point. Clear the
          board for 2 bonus points - totaling 10 points per board.
        </p>
        <p className="text-gray-50 mb-8 justify-center">Select a board:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {(Object.keys(boards) as BoardId[]).map((id) => {
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
                <h2
                  className={`text-xl font-bold mb-2 ${
                    completed === 9 ? "text-indigo-800" : "text-gray-600"
                  }`}
                >
                  {boards[id].title}
                </h2>

                <p className="text-sm text-gray-400 mb-4">
                  {boards[id].description}
                </p>

                <p
                  className={`text-sm font-medium ${
                    completed === 9 ? "text-[#ffd700]" : "text-indigo-600"
                  }`}
                >
                  {completed}/9 squares completed · {boardScore(progress[id])} pts
                </p>
              </button>
            );
          })}
        </div>

        <WeeklySubmit progress={progress} />
      </main>
    );
  }

  const tasks = boards[selectedBoard].tasks;
  const selected = progress[selectedBoard];
  const completedLines = completedLineCount(selected);
  const boardCompleted = selected.every(Boolean);
  const score = boardScore(selected);

  return (
    <main className="min-h-screen bg-[#10251B] flex flex-col items-center justify-center p-4 sm:p-6">
      <button
        onClick={backToSelection}
        className="mb-6 text-sm text-gray-50 hover:text-indigo-600"
      >
        ← Back to boards 🐸
      </button>

      <div
        ref={boardRef}
        className="w-full max-w-[640px] bg-[#10251B] p-4 sm:p-6 rounded-x1"
      >
        <h1 className="text-2xl sm:text-3x1 font-bold mb-6 text-center">
          {boards[selectedBoard].title}
        </h1>

        <div className="mb-6 text-center">
          <p className="text-sm text-gray-50 font-medium">SCORE</p>
          <p className="text-4xl font-black">{score}</p>
          <p className="text-sm text-gray-50 mt-2">
            {completedLines} completed lines
            {boardCompleted && " + 2 bonus points"}
          </p>
        </div>

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

        {boardCompleted && (
          <p className="mt-5 text-base sm:text-lg font-bold text-[#ffd700] text-center">
            🐸 Bingo! Board completed! 🐸
          </p>
        )}
      </div>

      <div className="w-full max-w-[640px] flex flex-col gap-3 mt-6">
        <button
          onClick={resetBoard}
          className="w-full px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
        >
          Reset Board
        </button>

        <button
          onClick={copyScreenshot}
          disabled={copying}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {copying ? "Copying..." : "📸📋 Copy Screenshot"}
        </button>

        {copyMessage && (
          <p className="text-sm text-center text-gray-600">{copyMessage}</p>
        )}
      </div>
    </main>
  );
}
