import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SportService } from "@/lib/services";
import { SportsCatalogueView } from "@/features/coach/sports-catalogue-view";

export const instant = false;

export default async function CoachSportsPage() {
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
