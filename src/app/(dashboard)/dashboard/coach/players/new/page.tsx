import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SportService } from "@/lib/services";
import { CreatePlayerForm } from "@/features/coach/create-player-form";

export const instant = false;

export default async function CoachCreatePlayerPage() {
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
