import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { MatchService, SportService, type MatchListItemDTO } from "@/lib/services";
import { MatchListView } from "@/features/matches";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachMatchesContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let initialMatches: MatchListItemDTO[] = [];
  let initialPagination = { total: 0, page: 1, limit: 20, totalPages: 1 };
  let sportsList: Array<{ id: string; name: string; isActive?: boolean }> = [];

  try {
    const [matchesResult, sports] = await Promise.all([
      MatchService.findMatchesPaginated({ page: 1, limit: 20 }),
      SportService.findAllWithPlayerCounts(),
    ]);

    initialMatches = matchesResult.matches;
    initialPagination = matchesResult.pagination;
    sportsList = sports.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
    }));
  } catch (err) {
    console.error("Failed to load matches on server:", err);
  }

  return (
    <AppShell user={user}>
      <MatchListView
        initialMatches={initialMatches}
        initialPagination={initialPagination}
        sportsList={sportsList}
      />
    </AppShell>
  );
}

export default function CoachMatchesPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachMatchesContent />
    </Suspense>
  );
}
