import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SessionService, SportService, type SessionListItemDTO } from "@/lib/services";
import { SessionListView } from "@/features/sessions";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachSessionsContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let initialSessions: SessionListItemDTO[] = [];
  let initialPagination = { total: 0, page: 1, limit: 20, totalPages: 1 };
  let sportsList: Array<{ id: string; name: string; isActive?: boolean }> = [];

  try {
    const [sessionsResult, sports] = await Promise.all([
      SessionService.findSessionsPaginated({ page: 1, limit: 20 }),
      SportService.findAllWithPlayerCounts(),
    ]);

    initialSessions = sessionsResult.sessions;
    initialPagination = sessionsResult.pagination;
    sportsList = sports.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
    }));
  } catch (err) {
    console.error("Failed to load practice sessions on server:", err);
  }

  return (
    <AppShell user={user}>
      <SessionListView
        initialSessions={initialSessions}
        initialPagination={initialPagination}
        sportsList={sportsList}
      />
    </AppShell>
  );
}

export default function CoachSessionsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachSessionsContent />
    </Suspense>
  );
}
