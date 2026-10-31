import { Suspense } from "react";
import AdminBoards from "@/components/AdminBoards";
import { addWeeks, getWeekId } from "@/lib/bingo";
import { isBingoAdminUser } from "@/lib/env";
import { getSession } from "@/lib/session";

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const session = await getSession();

  if (!session || !isBingoAdminUser(session.discordUserId)) {
    return (
      <main className="min-h-screen bg-[#10251B] p-6 text-gray-50">
        <div className="mx-auto max-w-lg rounded-xl border border-red-900 bg-red-950/40 p-6">
          <h1 className="text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-gray-300">
            This page is restricted to configured Discord administrators.
          </p>
        </div>
      </main>
    );
  }

  return <AdminBoards defaultWeekId={addWeeks(getWeekId(), 1)} />;
}

function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#10251B] p-6 text-gray-50">
      <div className="mx-auto max-w-lg rounded-xl border border-green-800 bg-green-950/40 p-6">
        Checking administrator access...
      </div>
    </main>
  );
}