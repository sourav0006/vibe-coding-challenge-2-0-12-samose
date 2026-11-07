import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { DashboardService, ReadinessService } from "@/lib/services";
import { CoachOverviewView } from "@/features/coach/coach-overview-view";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachOverviewContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  // Pre-fetch real database metrics, recent players, recent matches, and analytics on the server
  let initialStats = null;
  let initialRecentPlayers = null;
  let initialRecentMatches = null;
  let initialAttendanceTrend = null;
  let initialReadinessStats = null;

  try {
    const [stats, recentPlayers, recentMatches, attendanceTrend, readinessStats] = await Promise.all([
      DashboardService.getCoachStats(),
      DashboardService.getRecentPlayers(5),
      DashboardService.getRecentMatches(5),
      DashboardService.getAttendanceTrend(8),
      ReadinessService.getCoachReadinessStats(),
    ]);
    initialStats = stats;
    initialRecentPlayers = recentPlayers;
    initialRecentMatches = recentMatches;
    initialAttendanceTrend = attendanceTrend;
    initialReadinessStats = readinessStats;
  } catch (err) {
    console.error("Failed to load initial dashboard stats on server:", err);
  }

  return (
    <AppShell user={user}>
      <CoachOverviewView
        initialStats={initialStats}
        initialRecentPlayers={initialRecentPlayers}
        initialRecentMatches={initialRecentMatches}
        initialAttendanceTrend={initialAttendanceTrend}
        initialReadinessStats={initialReadinessStats}
      />
    </AppShell>
  );
}

export default function CoachDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachOverviewContent />
    </Suspense>
  );
}
