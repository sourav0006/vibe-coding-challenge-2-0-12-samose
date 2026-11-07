import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SportService } from "@/lib/services";
import { SportsCatalogueView } from "@/features/coach/sports-catalogue-view";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachSportsContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let initialSports = null;
  try {
    initialSports = await SportService.findAllWithPlayerCounts();
  } catch (err) {
    console.error("Failed to load initial sports on server:", err);
  }

  return (
    <AppShell user={user}>
      <SportsCatalogueView initialSports={initialSports} />
    </AppShell>
  );
}

export default function CoachSportsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachSportsContent />
    </Suspense>
  );
}
