"use client";

import { useEffect, useState } from "react";
import Leaderboard from "@/components/Leaderboard";
import { boardScore, formatWeekLabel, type Progress } from "@/lib/bingo";

type MeResponse = {
  user: {
    discordUserId: string;
    username: string;
    displayName: string;
  } | null;
  weekId: string;
  submission: {
    board1_score: number;
    board2_score: number;
    total_score: number;
  } | null;
  lifetimeTotal: number;
  error?: string;
};

const AUTH_ERRORS: Record<string, string> = {
  not_member:
    "Your Discord account is not in the frog server, so weekly scores cannot be submitted.",
  denied: "Discord login was cancelled.",
  invalid: "Discord login expired. Try connecting again.",
  failed: "Discord login failed. Try again in a moment.",
  config:
    "ScoresDB configuration error.",
};

type WeeklySubmitProps = {
  progress: Progress;
  weekId: string;
  locked: boolean;
  previewOnly: boolean;
};

export default function WeeklySubmit({
  progress,
  weekId,
  locked,
  previewOnly,
}: WeeklySubmitProps) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [authError] = useState(() => {
    if (typeof window === "undefined") return "";
    const error = new URLSearchParams(window.location.search).get("authError");
    return error ? (AUTH_ERRORS[error] ?? "Discord login failed.") : "";
  });

  const board1Score = boardScore(progress.board1);
  const board2Score = boardScore(progress.board2);
  const totalScore = board1Score + board2Score;
  const weekLabel = formatWeekLabel(weekId);

  async function loadMe() {
    try {
      const response = await fetch(
        `/api/me?weekId=${encodeURIComponent(weekId)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as MeResponse;
      setMe(data);
    } catch {
      setMe(null);
      setMessage("Could not check Discord login.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("authError")) {
      window.history.replaceState({}, "", "/");
    }

    let cancelled = false;
    fetch(`/api/me?weekId=${encodeURIComponent(weekId)}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data: MeResponse) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) {
          setMe(null);
          setMessage("Could not check Discord login.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [weekId]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMessage("");
    await loadMe();
  }

  async function submitScores() {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId, progress }),
      });
      const data = (await response.json()) as {
        error?: string;
        updated?: boolean;
        discordPosted?: boolean;
      };

      if (!response.ok) {
        setMessage(data.error ?? "Could not submit scores.");
        return;
      }

      const posted = data.discordPosted
        ? "and posted them to the frog Discord"
        : "but Discord could not be notified";
      setMessage(
        data.updated
          ? `Updated scores for ${weekLabel} ${posted}.`
          : `Submitted scores for ${weekLabel} ${posted}.`
      );
      await loadMe();
    } catch {
      setMessage("Could not submit scores.");
    } finally {
      setSubmitting(false);
    }
  }

  const user = me?.user ?? null;
  const saved = me?.submission;

  return (
    <>
      <section className="w-full max-w-lg mt-10 rounded-xl border border-green-800 bg-green-950/40 p-5 text-gray-50">
      <h2 className="text-lg font-bold mb-1">Weekly leaderboard submit</h2>
      <p className="text-sm text-gray-300 mb-4">
        {`Week of ${weekLabel || "…"}. Press the button below to submit your scores to the frog leaderboard.`}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
        <ScoreStat label="Guild" value={board1Score} />
        <ScoreStat label="Progression" value={board2Score} />
        <ScoreStat label="Total" value={totalScore} />
        <ScoreStat label="Lifetime" value={me?.lifetimeTotal ?? 0} />
      </div>

      {saved && (
        <p className="text-sm text-indigo-200 mb-4">
          Already saved this week: {saved.total_score}/20
          {` (guild ${saved.board1_score}, progression ${saved.board2_score})`}
        </p>
      )}

      {locked ? (
        <p className="text-sm text-amber-200">
          {previewOnly
            ? "Preview only until this week starts."
            : "This week is closed. Past weeks are read-only."}
        </p>
      ) : loading || me?.weekId !== weekId ? (
        <p className="text-sm text-gray-400">Checking Discord membership…</p>
      ) : user ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Connected as <span className="font-semibold">{user.displayName}</span>{" "}
            <span className="text-gray-400">({user.username})</span>
          </p>
          <button
            onClick={() => void submitScores()}
            disabled={submitting || locked}
            className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Submitting…"
              : saved
                ? "Update weekly scores"
                : "Submit weekly scores"}
          </button>
          <button
            onClick={() => void logout()}
            className="text-sm text-gray-400 hover:text-white"
          >
            Disconnect Discord
          </button>
        </div>
      ) : (
        <a
          href="/api/auth/discord"
          className="block w-full px-6 py-3 rounded-xl bg-[#5865F2] text-white font-semibold text-center hover:bg-[#4752c4] transition-colors"
        >
          Connect Discord to load saved scores
        </a>
      )}

      {(authError || message) && (
        <p className="text-sm text-center mt-4 text-amber-200">
          {authError || message}
        </p>
      )}
      </section>
      <Leaderboard />
    </>
  );
}

function ScoreStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-black/30 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
