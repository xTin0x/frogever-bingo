import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  boardScore,
  getWeekId,
  isProgress,
  isWeekId,
  isWeekStarted,
} from "@/lib/bingo";
import {
  getLifetimeTotal,
  getWeeklyBoard,
  upsertWeeklyScore,
} from "@/lib/db";
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

  const requestedWeekId =
    body !== null && typeof body === "object" && "weekId" in body
      ? (body as { weekId: unknown }).weekId
      : null;

  if (!isWeekId(requestedWeekId)) {
    return NextResponse.json({ error: "Invalid week." }, { status: 400 });
  }

  const currentWeekId = getWeekId();
  if (requestedWeekId !== currentWeekId) {
    return NextResponse.json(
      { error: "Only the current week can be submitted." },
      { status: 409 }
    );
  }

  if (!isWeekStarted(requestedWeekId)) {
    return NextResponse.json(
      { error: "The first week is currently preview-only." },
      { status: 409 }
    );
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

  const weekId = requestedWeekId;
  const board1Score = boardScore(progress.board1);
  const board2Score = boardScore(progress.board2);
  const totalScore = board1Score + board2Score;

  try {
    const board = await getWeeklyBoard(weekId);
    if (!board) {
      return NextResponse.json(
        { error: "This week's board is not configured yet." },
        { status: 409 }
      );
    }

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
    const lifetimeTotal = await getLifetimeTotal(session.discordUserId);

    const discordPosted = await postSubmissionWebhook({
      displayName: session.displayName,
      username: session.username,
      weekId,
      board1Score,
      board2Score,
      totalScore,
      lifetimeTotal,
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
