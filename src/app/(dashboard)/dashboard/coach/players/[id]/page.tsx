import { Suspense } from "react";
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
import DashboardLoading from "@/app/(dashboard)/loading";

interface CoachPlayerDetailPageProps {
  params: Promise<{ id: string }>;
}

async function CoachPlayerDetailContent({
  params,
}: CoachPlayerDetailPageProps) {
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
      SportService.findAllSimple(),
      AttendanceService.getPlayerAttendanceStats(id),
      MatchService.getPlayerMatchStats(id),
      ReadinessService.getPlayerReadiness(id),
      RemarkService.findByPlayer(id),
    ]);

    player = playerDoc;
    sportsList = sports;
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

export default function CoachPlayerDetailPage(props: CoachPlayerDetailPageProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachPlayerDetailContent {...props} />
    </Suspense>
  );
}
