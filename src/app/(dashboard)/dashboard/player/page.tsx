import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { PlayerPortalService, type PlayerDashboardOverviewDTO } from "@/lib/services";
import { PlayerOverviewView } from "@/features/player";

export const instant = false;

export default async function PlayerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=player");
  }

  if (user.role !== "player") {
    redirect("/login?error=unauthorized_role");
  }

  let overview: PlayerDashboardOverviewDTO | null = null;
  let loadError: string | null = null;

  try {
    overview = await PlayerPortalService.getPlayerDashboard(user.id);
  } catch (err: unknown) {
    console.error("Failed to load player dashboard on server:", err);
    loadError = err instanceof Error ? err.message : "Failed to load athlete dashboard overview.";
  }

  return (
    <AppShell user={user}>
      {overview ? (
        <PlayerOverviewView overview={overview} />
      ) : (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <p className="text-sm font-semibold text-rose-600">
            {loadError || "Could not retrieve athlete profile records."}
          </p>
        </div>
      )}
    </AppShell>
  );
}
