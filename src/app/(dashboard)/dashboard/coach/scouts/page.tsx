import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { ScoutService } from "@/lib/services";
import { ScoutListView } from "@/features/coach/scout-list-view";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachScoutsContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let initialScouts = null;
  let initialPagination = null;
  let initialStats = null;

  try {
    const scoutsResult = await ScoutService.findScoutsPaginated({ page: 1, limit: 10 });
    initialScouts = scoutsResult.scouts;
    initialPagination = scoutsResult.pagination;
    initialStats = scoutsResult.stats;
  } catch (err) {
    console.error("Failed to pre-fetch scouts list on server:", err);
  }

  return (
    <AppShell user={user}>
      <ScoutListView
        initialScouts={initialScouts}
        initialPagination={initialPagination}
        initialStats={initialStats}
      />
    </AppShell>
  );
}

export default function CoachScoutsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachScoutsContent />
    </Suspense>
  );
}
