"use client";

import { useState } from "react";
import Link from "next/link";
import { parseBoardTasksCsv } from "@/lib/board-csv";

const TASK_COUNT = 9;

export default function AdminBoards({ defaultWeekId }: { defaultWeekId: string }) {
  const [weekId, setWeekId] = useState(defaultWeekId);
  const [board1Tasks, setBoard1Tasks] = useState(() => emptyTasks());
  const [board2Tasks, setBoard2Tasks] = useState(() => emptyTasks());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveBoards(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekId,
          tasks: { board1: board1Tasks, board2: board2Tasks },
        }),
      });
      const data = (await response.json()) as { error?: string; weekId?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save board tasks.");
      }
      setMessage(`Saved tasks for week ${data.weekId}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save board tasks."
      );
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const tasks = parseBoardTasksCsv(await file.text());
      setBoard1Tasks(tasks.board1);
      setBoard2Tasks(tasks.board2);
      setMessage(`Loaded tasks from ${file.name}. Review them before publishing.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not parse the CSV file."
      );
    } finally {
      input.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#10251B] p-6 text-gray-50">
      <form onSubmit={saveBoards} className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-gray-300 hover:text-white"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold">Weekly board admin</h1>
        <p className="mt-2 text-sm text-gray-300">
          Publish tasks for the current or a future week. Future tasks stay hidden until they become readable.
        </p>

        <label className="mt-6 block text-sm font-semibold">
          Import tasks from CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => void importCsv(event)}
            className="mt-2 block w-full rounded-lg border border-green-800 bg-black/30 px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <span className="mt-2 block text-xs font-normal text-gray-400">
            Format: a header of <code>board1,board2</code>, followed by 9 rows. Quote tasks that contain commas.
          </span>
        </label>

        <label className="mt-6 block text-sm font-semibold">
          Week ID
          <input
            value={weekId}
            onChange={(event) => setWeekId(event.target.value)}
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
            required
            className="mt-2 w-full rounded-lg border border-green-800 bg-black/30 px-3 py-2 text-gray-50"
          />
        </label>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <TaskEditor title="Guild Contribution" tasks={board1Tasks} onChange={setBoard1Tasks} />
          <TaskEditor title="Personal Progression" tasks={board2Tasks} onChange={setBoard2Tasks} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Publish weekly tasks"}
        </button>

        {message && <p className="mt-4 text-center text-sm text-amber-200">{message}</p>}
      </form>
    </main>
  );
}

function TaskEditor({
  title,
  tasks,
  onChange,
}: {
  title: string;
  tasks: string[];
  onChange: (tasks: string[]) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-green-800 bg-green-950/40 p-4">
      <legend className="px-2 font-semibold">{title}</legend>
      <div className="flex flex-col gap-2">
        {tasks.map((task, index) => (
          <input
            key={index}
            value={task}
            onChange={(event) => {
              const nextTasks = [...tasks];
              nextTasks[index] = event.target.value;
              onChange(nextTasks);
            }}
            placeholder={`Task ${index + 1}`}
            required
            className="rounded-lg border border-green-900 bg-black/30 px-3 py-2 text-sm text-gray-50"
          />
        ))}
      </div>
    </fieldset>
  );
}

function emptyTasks() {
  return Array.from({ length: TASK_COUNT }, () => "");
}