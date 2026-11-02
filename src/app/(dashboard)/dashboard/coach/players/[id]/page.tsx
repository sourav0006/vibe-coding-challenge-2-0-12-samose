import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import {
  PlayerService,
  SportService,
  AttendanceService,
  MatchService,
  ReadinessService,
  RemarkService,
  type PlayerAttendanceStatsResult,
  type PlayerMatchStatsResult,
  type PlayerReadinessDTO,
  type SafeCoachRemarkDTO,
} from "@/lib/services";
import { PlayerProfileView } from "@/features/coach/player-profile-view";
import { objectIdSchema } from "@/lib/validation";

export const instant = false;

export default async function CoachPlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  const { id } = await params;
  const idValidation = objectIdSchema.safeParse(id);
  if (!idValidation.success) {
    notFound();
  }

  let player = null;
  let sportsList: Array<{ id: string; name: string; isActive: boolean }> = [];
  let attendanceStats: PlayerAttendanceStatsResult | null = null;
  let matchStats: PlayerMatchStatsResult | null = null;
  let readinessStats: PlayerReadinessDTO | null = null;
  let initialRemarks: SafeCoachRemarkDTO[] = [];

  try {
    const [playerDoc, sports, stats, matchResult, readinessResult, remarksDocs] = await Promise.all([
      PlayerService.getPlayerDetails(id),
      SportService.findAllWithPlayerCounts(),
      AttendanceService.getPlayerAttendanceStats(id),
      MatchService.getPlayerMatchStats(id),
      ReadinessService.getPlayerReadiness(id),
      RemarkService.findByPlayer(id),
    ]);

    player = playerDoc;
    sportsList = sports.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
    }));
    attendanceStats = stats;
    matchStats = matchResult;
    readinessStats = readinessResult;
    initialRemarks = remarksDocs.map((r) => RemarkService.toSafeDTO(r));
  } catch (err) {
    console.error("Failed to load player profile on server:", err);
  }

  if (!player) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <PlayerProfileView
        initialPlayer={player}
        sportsList={sportsList}
        initialAttendanceStats={attendanceStats}
        initialMatchStats={matchStats}
        initialReadiness={readinessStats}
        initialRemarks={initialRemarks}
      />
    </AppShell>
  );
}
