import { connection, NextResponse } from "next/server";
import { getWeekId } from "@/lib/bingo";
import { getLeaderboard } from "@/lib/db";
import { isBingoAdminUser } from "@/lib/env";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  await connection();

  try {
    const isWeekly = new URL(request.url).searchParams.get("period") === "weekly";
    const weekId = isWeekly ? getWeekId() : undefined;
    const entries = await getLeaderboard(weekId);
    const session = await getSession();
    return NextResponse.json(
      {
        isAdmin: session ? isBingoAdminUser(session.discordUserId) : false,
        weekId,
        entries: entries.map(({ discordUserId, ...entry }) => ({
          ...entry,
          isCurrentUser: session?.discordUserId === discordUserId,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to load leaderboard:", error);
    return NextResponse.json(
      { error: "Could not load the leaderboard." },
      { status: 500 }
    );
  }
}
