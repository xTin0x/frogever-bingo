"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { formatWeekLabel } from "@/lib/bingo";

type LeaderboardWeek = {
  weekId: string;
  board1Score: number;
  board2Score: number;
  totalScore: number;
  submittedAt: string;
};

type LeaderboardEntry = {
  displayName: string;
  username: string;
  lifetimeTotal: number;
  board1TasksCompleted: number;
  board2TasksCompleted: number;
  firstSubmittedAt: string;
  weeks: LeaderboardWeek[];
  isCurrentUser: boolean;
};

export default function Leaderboard({ adminView }: { adminView: boolean }) {
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<"weekly" | "all-time">("all-time");
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [weekId, setWeekId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const hideCurrentUser = isAdmin && adminView;

  async function toggleLeaderboard(nextPeriod: "weekly" | "all-time") {
    if (open && period === nextPeriod) {
      requestId.current += 1;
      setLoading(false);
      setOpen(false);
      return;
    }

    const currentRequestId = ++requestId.current;
    setOpen(true);
    setPeriod(nextPeriod);
    setExpanded(null);
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/leaderboard${nextPeriod === "weekly" ? "?period=weekly" : ""}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as {
        entries?: LeaderboardEntry[];
        error?: string;
        isAdmin?: boolean;
        weekId?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load the leaderboard.");
      }
      if (requestId.current !== currentRequestId) return;
      setEntries(data.entries ?? []);
      setIsAdmin(data.isAdmin === true);
      setWeekId(data.weekId ?? null);
    } catch (requestError) {
      if (requestId.current !== currentRequestId) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load the leaderboard."
      );
    } finally {
      if (requestId.current === currentRequestId) {
        setLoading(false);
      }
    }
  }

  async function copyScreenshot() {
    if (!leaderboardRef.current) return;

    try {
      setCopying(true);
      setCopyMessage("");
      const blob = await toBlob(leaderboardRef.current, {
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
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyMessage("Screenshot copied to your clipboard.");
    } catch (screenshotError) {
      console.error("Leaderboard screenshot copy failed:", screenshotError);
      setCopyMessage("Could not copy screenshot. Check browser permissions.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="w-full max-w-lg mt-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void toggleLeaderboard("weekly")}
          className={`rounded-xl border px-3 py-3 font-semibold transition-colors ${
            open && period === "weekly"
              ? "border-amber-400 bg-amber-400 text-green-950"
              : "border-amber-700 bg-green-950/60 text-amber-100 hover:bg-green-900"
          }`}
          aria-expanded={open && period === "weekly"}
          aria-controls="leaderboard-panel"
        >
          {open && period === "weekly" ? "Hide weekly" : "Weekly leaderboard"}
        </button>
        <button
          type="button"
          onClick={() => void toggleLeaderboard("all-time")}
          className={`rounded-xl border px-3 py-3 font-semibold transition-colors ${
            open && period === "all-time"
              ? "border-indigo-400 bg-indigo-600 text-white"
              : "border-indigo-800 bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900"
          }`}
          aria-expanded={open && period === "all-time"}
          aria-controls="leaderboard-panel"
        >
          {open && period === "all-time"
            ? "Hide all-time"
            : "All-time leaderboard"}
        </button>
      </div>

      {open && (
        <section
          id="leaderboard-panel"
          className={`mt-3 rounded-xl border p-4 text-gray-50 ${
            period === "weekly"
              ? "border-amber-800 bg-green-950/40"
              : "border-indigo-800 bg-indigo-950/40"
          }`}
        >
          <div ref={leaderboardRef}>
            <h2 className="text-lg font-bold mb-1">
              {period === "weekly"
                ? `🐸 Weekly leaderboard${weekId ? ` · ${formatWeekLabel(weekId)}` : ""}`
                : "🐸 All-time leaderboard"}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {period === "weekly"
                ? "Ranked by scores submitted this week."
                : "Click on a name to view more details."}
            </p>

            {loading ? (
              <p className="text-sm text-gray-400">
                Loading {period === "weekly" ? "weekly" : "all-time"} leaderboard...
              </p>
            ) : error ? (
              <p className="text-sm text-amber-200">{error}</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-gray-400">No scores submitted yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry, index) => {
                  const isExpanded = expanded === index;
                  const nameContent = (
                    <>
                      <span className="block truncate font-semibold">
                        {entry.displayName}
                        {entry.isCurrentUser && !hideCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-[#ffd700]">
                            (You)
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        @{entry.username}
                      </span>
                    </>
                  );
                  return (
                    <div
                      key={`${entry.displayName}-${index}`}
                      className={`rounded-lg border overflow-hidden ${
                        entry.isCurrentUser && !hideCurrentUser
                          ? "border-[#ffd700] bg-indigo-950/50"
                          : "border-green-900 bg-black/20"
                      }`}
                    >
                      <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 p-3">
                        <span className="text-sm font-bold text-gray-400">
                          {index + 1}
                        </span>
                        {period === "all-time" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(isExpanded ? null : index)
                            }
                            className="min-w-0 text-left hover:text-indigo-300"
                            aria-expanded={isExpanded}
                          >
                            {nameContent}
                          </button>
                        ) : (
                          <div className="min-w-0 text-left">{nameContent}</div>
                        )}
                        <span className="text-right font-bold text-[#ffd700]">
                          {entry.lifetimeTotal} pts
                        </span>
                      </div>

                      {period === "all-time" && (
                        <div className="grid grid-cols-2 gap-2 border-t border-green-900 px-3 py-2 text-xs text-gray-300">
                          <span>Guild tasks: {entry.board1TasksCompleted}</span>
                          <span>
                            Progression tasks: {entry.board2TasksCompleted}
                          </span>
                        </div>
                      )}

                      {period === "all-time" && isExpanded && (
                        <div className="border-t border-green-900 p-3">
                          <h3 className="text-sm font-semibold mb-2">
                            Weekly scores
                          </h3>
                          <div className="flex flex-col gap-2">
                            {entry.weeks.map((week) => (
                              <div
                                key={week.weekId}
                                className="grid grid-cols-[1fr_auto] gap-3 text-sm"
                              >
                                <span>{formatWeekLabel(week.weekId)}</span>
                                <span className="text-right text-gray-300">
                                  Guild {week.board1Score} · Progression{" "}
                                  {week.board2Score} ·{" "}
                                  <strong className="text-gray-50">
                                    {week.totalScore}
                                  </strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void copyScreenshot()}
                disabled={copying || loading || entries.length === 0}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copying ? "Taking picture..." : "📸 Copy leaderboard picture"}
              </button>
              {copyMessage && (
                <p className="mt-2 text-center text-xs text-gray-400" aria-live="polite">
                  {copyMessage}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
