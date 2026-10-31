import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { boardScore, getWeekId, isProgress } from "@/lib/bingo";
import { upsertWeeklyScore } from "@/lib/db";
import { postSubmissionWebhook } from "@/lib/discord";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const store = await cookies();
  const session = decodeSession(store.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json(
      { error: "Connect Discord and join the frog server to submit." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const progress =
    body !== null && typeof body === "object" && "progress" in body
      ? (body as { progress: unknown }).progress
      : null;

  if (!isProgress(progress)) {
    return NextResponse.json(
      { error: "Submit both boards' current progress." },
      { status: 400 }
    );
  }

  const weekId = getWeekId();
  const board1Score = boardScore(progress.board1);
  const board2Score = boardScore(progress.board2);
  const totalScore = board1Score + board2Score;

  try {
    const { score, updated } = await upsertWeeklyScore({
      discordUserId: session.discordUserId,
      username: session.username,
      displayName: session.displayName,
      weekId,
      board1Score,
      board2Score,
      totalScore,
      progress,
    });

    const discordPosted = await postSubmissionWebhook({
      displayName: session.displayName,
      username: session.username,
      weekId,
      board1Score,
      board2Score,
      totalScore,
      updated,
    });

    return NextResponse.json({
      ok: true,
      updated,
      discordPosted,
      submission: score,
    });
  } catch (error) {
    console.error("Weekly score submit failed:", error);
    return NextResponse.json(
      { error: "Could not save this week's scores." },
      { status: 500 }
    );
  }
}
