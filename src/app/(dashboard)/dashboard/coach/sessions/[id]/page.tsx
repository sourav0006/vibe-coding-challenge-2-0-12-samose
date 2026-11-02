import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SessionService } from "@/lib/services";
import { AttendanceSheetView } from "@/features/attendance";
import { objectIdSchema } from "@/lib/validation";

export const instant = false;

export default async function SessionAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
