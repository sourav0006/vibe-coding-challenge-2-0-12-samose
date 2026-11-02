import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { PlayerPortalService, type SafeCoachRemarkDTO } from "@/lib/services";
import { PlayerRemarksView } from "@/features/player";

export const instant = false;

export default async function PlayerRemarksPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=player");
  }

  if (user.role !== "player") {
    redirect("/login?error=unauthorized_role");
  }

  let remarks: SafeCoachRemarkDTO[] = [];

  try {
    remarks = await PlayerPortalService.getPlayerRemarks(user.id);
  } catch (err: unknown) {
    console.error("Failed to load coaching remarks on server:", err);
  }

  return (
    <AppShell user={user}>
      <PlayerRemarksView remarks={remarks} />
    </AppShell>
  );
}
