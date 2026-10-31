import { connection, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";

export async function GET() {
  await connection();

  try {
    const entries = await getLeaderboard();
    return NextResponse.json(
      { entries },
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
