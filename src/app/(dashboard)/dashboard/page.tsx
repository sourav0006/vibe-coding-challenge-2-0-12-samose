import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultDashboardForRole } from "@/lib/auth";
import DashboardLoading from "@/app/(dashboard)/loading";

async function DashboardRootContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect to role-specific dashboard
  redirect(getDefaultDashboardForRole(user.role));
  return null;
}

export default function DashboardRootPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardRootContent />
    </Suspense>
  );
}
