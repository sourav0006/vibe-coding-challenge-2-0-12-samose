import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { ReadinessService, SportService, type SafeScoutPlayerDTO } from "@/lib/services";
import { SportTalentDiscoveryView } from "@/features/readiness";
import DashboardLoading from "@/app/(dashboard)/loading";

interface SportTalentDiscoveryPageProps {
  params: Promise<{ sportId: string }>;
}

async function SportTalentDiscoveryContent({
  params,
}: SportTalentDiscoveryPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=scout");
  }

  if (user.role !== "scout") {
    redirect("/login?error=unauthorized_role");
  }

  const { sportId } = await params;

  if (!isValidObjectId(sportId)) {
    redirect("/dashboard/scout/discover");
  }

  let sport = null;
  try {
    sport = await SportService.findById(sportId);
  } catch (err) {
    console.error("Failed to retrieve sport:", err);
  }

  if (!sport) {
    redirect("/dashboard/scout/discover");
  }

  let readyPlayers: SafeScoutPlayerDTO[] = [];
  let totalReadyCount = 0;

  try {
    const discoveryData = await ReadinessService.getScoutReadyPlayers({
      sportId,
      page: 1,
      limit: 100,
    });
    readyPlayers = discoveryData.players;
    totalReadyCount = discoveryData.totalReadyCount;
  } catch (err) {
    console.error("Failed to load sport discovery:", err);
  }

  return (
    <AppShell user={user}>
      <SportTalentDiscoveryView
        sport={{ id: sport._id.toString(), name: sport.name }}
        initialPlayers={readyPlayers}
        totalReadyCount={totalReadyCount}
      />
    </AppShell>
  );
}

export default function SportTalentDiscoveryPage(props: SportTalentDiscoveryPageProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SportTalentDiscoveryContent {...props} />
    </Suspense>
  );
}
