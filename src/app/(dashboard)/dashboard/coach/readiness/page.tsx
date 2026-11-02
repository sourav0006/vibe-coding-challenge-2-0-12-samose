import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { ReadinessService, type PlayerReadinessDTO, type CoachReadinessStats } from "@/lib/services";
import { CoachReadinessView } from "@/features/readiness";

export const instant = false;

export default async function CoachReadinessPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let initialPlayers: PlayerReadinessDTO[] = [];
  let initialStats: CoachReadinessStats = {
    totalPlayers: 0,
    totalReadyPlayers: 0,
    totalNotReadyPlayers: 0,
    meetingAttendanceCriterion: 0,
    meetingMatchCriterion: 0,
  };
  let sportsList: Array<{ id: string; name: string }> = [];

  try {
    const result = await ReadinessService.getCoachReadinessList({ page: 1, limit: 100 });
    initialPlayers = result.players;
    initialStats = result.stats;
    sportsList = result.sportsList;
  } catch (err) {
    console.error("Failed to load readiness on server:", err);
  }

  return (
    <AppShell user={user}>
      <CoachReadinessView
        initialPlayers={initialPlayers}
        initialStats={initialStats}
        sportsList={sportsList}
      />
    </AppShell>
  );
}
