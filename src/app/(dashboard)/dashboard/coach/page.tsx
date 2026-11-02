import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { DashboardService } from "@/lib/services";
import { CoachOverviewView } from "@/features/coach/coach-overview-view";

export const instant = false;

export default async function CoachDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  // Pre-fetch real database metrics, recent players, and recent matches on the server
  let initialStats = null;
  let initialRecentPlayers = null;
  let initialRecentMatches = null;

  try {
    const [stats, recentPlayers, recentMatches] = await Promise.all([
      DashboardService.getCoachStats(),
      DashboardService.getRecentPlayers(5),
      DashboardService.getRecentMatches(5),
    ]);
    initialStats = stats;
    initialRecentPlayers = recentPlayers;
    initialRecentMatches = recentMatches;
  } catch (err) {
    console.error("Failed to load initial dashboard stats on server:", err);
  }

  return (
    <AppShell user={user}>
      <CoachOverviewView
        initialStats={initialStats}
        initialRecentPlayers={initialRecentPlayers}
        initialRecentMatches={initialRecentMatches}
      />
    </AppShell>
  );
}
