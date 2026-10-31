import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWeekId } from "@/lib/bingo";
import { getWeeklyScore } from "@/lib/db";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const store = await cookies();
  const session = decodeSession(store.get(SESSION_COOKIE)?.value);
  const weekId = getWeekId();

  const headers = { "Cache-Control": "no-store" };

  if (!session) {
    return NextResponse.json(
      { user: null, weekId, submission: null },
      { headers }
    );
  }

  try {
    const submission = await getWeeklyScore(session.discordUserId, weekId);
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
