import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWeekId, isWeekId } from "@/lib/bingo";
import { getLifetimeTotal, getWeeklyScore } from "@/lib/db";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const store = await cookies();
  const session = decodeSession(store.get(SESSION_COOKIE)?.value);
  const currentWeekId = getWeekId();
  const requestedWeekId = new URL(request.url).searchParams.get("weekId");
  const weekId = requestedWeekId ?? currentWeekId;

  const headers = { "Cache-Control": "no-store" };

  if (!isWeekId(weekId)) {
    return NextResponse.json(
      { error: "Invalid week." },
      { status: 400, headers }
    );
  }

  if (!session) {
    return NextResponse.json(
      { user: null, weekId, submission: null, lifetimeTotal: 0 },
      { headers }
    );
  }

  try {
    const submission = await getWeeklyScore(session.discordUserId, weekId);
    const lifetimeTotal = await getLifetimeTotal(session.discordUserId);
    return NextResponse.json(
      {
        user: {
          discordUserId: session.discordUserId,
          username: session.username,
          displayName: session.displayName,
          avatar: session.avatar,
        },
        weekId,
        submission,
        lifetimeTotal,
      },
      { headers }
    );
  } catch (error) {
    console.error("Failed to load session user:", error);
    return NextResponse.json(
      { error: "Could not load account." },
      { status: 500 }
    );
  }
}
