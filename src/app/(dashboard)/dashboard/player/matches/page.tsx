import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { PlayerPortalService, type PlayerMatchHistoryResult } from "@/lib/services";
import { PlayerMatchesView } from "@/features/player";

export const instant = false;

export default async function PlayerMatchesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=player");
  }

  if (user.role !== "player") {
    redirect("/login?error=unauthorized_role");
  }

  let matchesData: PlayerMatchHistoryResult = {
    totalMatchesPlayed: 0,
    averageScore: null,
    highestScore: null,
    lowestScore: null,
    history: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };

  try {
    matchesData = await PlayerPortalService.getPlayerMatchHistory(user.id, {
      page: 1,
      limit: 20,
    });
  } catch (err: unknown) {
    console.error("Failed to load match history on server:", err);
  }

  return (
    <AppShell user={user}>
      <PlayerMatchesView initialData={matchesData} />
    </AppShell>
  );
}
