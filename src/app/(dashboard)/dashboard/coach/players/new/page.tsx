import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SportService } from "@/lib/services";
import { CreatePlayerForm } from "@/features/coach/create-player-form";
import DashboardLoading from "@/app/(dashboard)/loading";

async function CoachCreatePlayerContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let sportsList: Array<{ id: string; name: string }> = [];
  try {
    const activeSports = await SportService.findAllActive();
    sportsList = activeSports.map((s) => ({ id: s._id.toString(), name: s.name }));
  } catch (err) {
    console.error("Failed to load active sports on server:", err);
  }

  return (
    <AppShell user={user}>
      <CreatePlayerForm initialSports={sportsList} />
    </AppShell>
  );
}

export default function CoachCreatePlayerPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CoachCreatePlayerContent />
    </Suspense>
  );
}
