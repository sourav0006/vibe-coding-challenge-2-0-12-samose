import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { ReadinessService } from "@/lib/services";
import { TalentDiscoveryView } from "@/features/readiness";
import DashboardLoading from "@/app/(dashboard)/loading";

async function ScoutTalentDiscoveryContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=scout");
  }

  if (user.role !== "scout") {
    redirect("/login?error=unauthorized_role");
  }

  let availableSports: Array<{ id: string; name: string; count: number }> = [];
  let totalReadyCount = 0;

  try {
    const discoveryData = await ReadinessService.getScoutReadyPlayers({
      page: 1,
      limit: 100,
    });
    availableSports = discoveryData.availableSports;
    totalReadyCount = discoveryData.totalReadyCount;
  } catch (err) {
    console.error("Failed to load scout talent discovery:", err);
  }

  return (
    <AppShell user={user}>
      <TalentDiscoveryView
        availableSports={availableSports}
        totalReadyCount={totalReadyCount}
      />
    </AppShell>
  );
}

export default function ScoutTalentDiscoveryPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ScoutTalentDiscoveryContent />
    </Suspense>
  );
}
