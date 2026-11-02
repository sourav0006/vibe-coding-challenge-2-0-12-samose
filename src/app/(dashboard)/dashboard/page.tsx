import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultDashboardForRole } from "@/lib/auth";

export const instant = false;

export default async function DashboardRootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect to role-specific dashboard
  redirect(getDefaultDashboardForRole(user.role));
}
