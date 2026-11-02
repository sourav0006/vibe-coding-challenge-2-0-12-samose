import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { ReadinessService, type SafeScoutPlayerDTO } from "@/lib/services";
import { ScoutDiscoveryView } from "@/features/readiness";

export const instant = false;

export default async function ScoutDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=scout");
  }

  if (user.role !== "scout") {
    redirect("/login?error=unauthorized_role");
  }

  let readyPlayers: SafeScoutPlayerDTO[] = [];
  let totalReadyCount = 0;
  let availableSports: Array<{ id: string; name: string; count: number }> = [];

  try {
    const discoveryData = await ReadinessService.getScoutReadyPlayers({
      page: 1,
      limit: 50,
    });
    readyPlayers = discoveryData.players;
    totalReadyCount = discoveryData.totalReadyCount;
    availableSports = discoveryData.availableSports;
  } catch (err) {
    console.error("Failed to load scout discovery on server:", err);
  }

  return (
    <AppShell user={user}>
      <ScoutDiscoveryView
        initialPlayers={readyPlayers}
        initialTotalReadyCount={totalReadyCount}
        initialAvailableSports={availableSports}
      />
    </AppShell>
  );
}
