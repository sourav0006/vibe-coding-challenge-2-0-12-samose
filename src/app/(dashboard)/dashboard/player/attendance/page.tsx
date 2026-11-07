import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { PlayerPortalService, type PlayerAttendanceHistoryResult } from "@/lib/services";
import { PlayerAttendanceView } from "@/features/player";
import DashboardLoading from "@/app/(dashboard)/loading";

async function PlayerAttendanceContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=player");
  }

  if (user.role !== "player") {
    redirect("/login?error=unauthorized_role");
  }

  let attendanceData: PlayerAttendanceHistoryResult = {
    attendancePercentage: "N/A",
    numericPercentage: null,
    totalApplicableClosedSessions: 0,
    presentSessions: 0,
    absentSessions: 0,
    history: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };

  try {
    attendanceData = await PlayerPortalService.getPlayerAttendanceHistory(user.id, {
      page: 1,
      limit: 20,
    });
  } catch (err: unknown) {
    console.error("Failed to load attendance history on server:", err);
  }

  return (
    <AppShell user={user}>
      <PlayerAttendanceView initialData={attendanceData} />
    </AppShell>
  );
}

export default function PlayerAttendancePage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <PlayerAttendanceContent />
    </Suspense>
  );
}
