import { NextResponse } from "next/server";
import { getWeekId, isWeekId } from "@/lib/bingo";
import { getWeeklyBoard } from "@/lib/db";

export async function GET(request: Request) {
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

  if (weekId > currentWeekId) {
    return NextResponse.json(
      { error: "That week's tasks are not available yet." },
      { status: 404, headers }
    );
  }

  try {
    const board = await getWeeklyBoard(weekId);
    if (!board) {
      return NextResponse.json(
        { error: "No board is configured for that week." },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        weekId: board.week_id,
        board1Tasks: board.board1_tasks,
        board2Tasks: board.board2_tasks,
      },
      { headers }
    );
  } catch (error) {
    console.error("Failed to load weekly board:", error);
    return NextResponse.json(
      { error: "Could not load this week's board." },
      { status: 500, headers }
    );
  }
}
