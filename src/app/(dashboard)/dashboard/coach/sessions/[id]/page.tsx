import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SessionService } from "@/lib/services";
import { AttendanceSheetView } from "@/features/attendance";
import { objectIdSchema } from "@/lib/validation";
import DashboardLoading from "@/app/(dashboard)/loading";

interface SessionAttendancePageProps {
  params: Promise<{ id: string }>;
}

async function SessionAttendanceContent({
  params,
}: SessionAttendancePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  const { id } = await params;
  const idValidation = objectIdSchema.safeParse(id);
  if (!idValidation.success) {
    notFound();
  }

  let sheet = null;

  try {
    sheet = await SessionService.getAttendanceSheet(id);
  } catch (err) {
    console.error("Failed to load session attendance sheet on server:", err);
  }

  if (!sheet) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <AttendanceSheetView initialData={sheet} />
    </AppShell>
  );
}

export default function SessionAttendancePage(props: SessionAttendancePageProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SessionAttendanceContent {...props} />
    </Suspense>
  );
}
