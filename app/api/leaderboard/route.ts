import { connection, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";
import { isBingoAdminUser } from "@/lib/env";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();

  try {
    const entries = await getLeaderboard();
    const session = await getSession();
    return NextResponse.json(
      {
        isAdmin: session ? isBingoAdminUser(session.discordUserId) : false,
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
