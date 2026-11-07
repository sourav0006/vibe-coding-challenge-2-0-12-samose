import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { PlayerService, SportService } from "@/lib/services";
import { PlayerListView } from "@/features/coach/player-list-view";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachPlayersContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let initialPlayers = null;
  let initialPagination = null;
  let sportsList: Array<{ id: string; name: string }> = [];

  try {
    const [playersResult, activeSports] = await Promise.all([
      PlayerService.findPlayersPaginated({ page: 1, limit: 10 }),
      SportService.findAllActive(),
    ]);

    initialPlayers = playersResult.players;
    initialPagination = playersResult.pagination;
    sportsList = activeSports.map((s) => ({ id: s._id.toString(), name: s.name }));
  } catch (err) {
    console.error("Failed to pre-fetch players list on server:", err);
  }

  return (
    <AppShell user={user}>
      <PlayerListView
        initialPlayers={initialPlayers}
        initialPagination={initialPagination}
        sportsList={sportsList}
      />
    </AppShell>
  );
}

export default function CoachPlayersPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachPlayersContent />
    </Suspense>
  );
}
