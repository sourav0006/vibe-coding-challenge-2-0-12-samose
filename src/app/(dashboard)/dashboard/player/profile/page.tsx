import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { PlayerPortalService, type SafePlayerProfileDTO } from "@/lib/services";
import { PlayerProfileView } from "@/features/player";

export const instant = false;

export default async function PlayerProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=player");
  }

  if (user.role !== "player") {
    redirect("/login?error=unauthorized_role");
  }

  let profile: SafePlayerProfileDTO | null = null;
  let loadError: string | null = null;

  try {
    profile = await PlayerPortalService.getPlayerProfile(user.id);
  } catch (err: unknown) {
    console.error("Failed to load player profile on server:", err);
    loadError = err instanceof Error ? err.message : "Failed to load athlete profile.";
  }

  return (
    <AppShell user={user}>
      {profile ? (
        <PlayerProfileView profile={profile} />
      ) : (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <p className="text-sm font-semibold text-rose-600">
            {loadError || "Could not retrieve athlete profile records."}
          </p>
        </div>
      )}
    </AppShell>
  );
}
