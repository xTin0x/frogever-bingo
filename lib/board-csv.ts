import type { BoardTasks } from "@/lib/bingo";

export function parseBoardTasksCsv(csv: string): BoardTasks {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length !== 10) {
    throw new Error("CSV must contain a header and exactly 9 task rows.");
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (header.length !== 2 || header[0] !== "board1" || header[1] !== "board2") {
    throw new Error("CSV header must be: board1,board2");
  }

  const board1 = rows.slice(1).map((row) => row[0]?.trim() ?? "");
  const board2 = rows.slice(1).map((row) => row[1]?.trim() ?? "");
  if (
    board1.some((task) => !task) ||
    board2.some((task) => !task) ||
    rows.slice(1).some((row) => row.length !== 2)
  ) {
    throw new Error("Every task row must contain one task for each board.");
  }

  return { board1, board2 };
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r" || quoted) {
      cell += character;
    }
  }

  if (quoted) {
    throw new Error("CSV contains an unclosed quoted field.");
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows[0]?.[0]?.charCodeAt(0) === 0xfeff) {
    rows[0][0] = rows[0][0].slice(1);
  }

  return rows;
}
