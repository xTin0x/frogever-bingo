import { NextResponse } from "next/server";
import { getBingoAdminUserIds } from "@/lib/env";
import { getWeekId, isBoardTasks, isWeekId } from "@/lib/bingo";
import { saveWeeklyBoard } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let adminUserIds: string[];
  try {
    adminUserIds = getBingoAdminUserIds();
  } catch {
    return NextResponse.json(
      { error: "Board administration is not configured." },
      { status: 503 }
    );
  }

  if (!adminUserIds.includes(session.discordUserId)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
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
  const tasks =
    body !== null && typeof body === "object" && "tasks" in body
      ? (body as { tasks: unknown }).tasks
      : null;

  if (!isWeekId(requestedWeekId)) {
    return NextResponse.json({ error: "Invalid week." }, { status: 400 });
  }

  if (!isBoardTasks(tasks)) {
    return NextResponse.json(
      { error: "Each board must contain exactly 9 non-empty tasks." },
      { status: 400 }
    );
  }

  if (requestedWeekId < getWeekId()) {
    return NextResponse.json(
      { error: "Past weeks cannot be changed." },
      { status: 409 }
    );
  }

  try {
    const board = await saveWeeklyBoard({
      weekId: requestedWeekId,
      tasks,
    });
    return NextResponse.json({
      ok: true,
      weekId: board.week_id,
      board1Tasks: board.board1_tasks,
      board2Tasks: board.board2_tasks,
    });
  } catch (error) {
    console.error("Failed to save weekly board:", error);
    return NextResponse.json(
      { error: "Could not save this week's board." },
      { status: 500 }
    );
  }
}
