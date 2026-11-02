import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { ReadinessService } from "@/lib/services";
import { ScoutPlayerProfileView } from "@/features/readiness";
import { objectIdSchema } from "@/lib/validation";

export const instant = false;

export default async function ScoutPlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=scout");
  }

  if (user.role !== "scout") {
    redirect("/login?error=unauthorized_role");
  }

  const { id } = await params;
  const idValidation = objectIdSchema.safeParse(id);
  if (!idValidation.success) {
    notFound();
  }

  let profile = null;

  try {
    profile = await ReadinessService.getScoutPlayerProfile(id);
  } catch (err) {
    console.error("Failed to load scout player profile on server:", err);
  }

  // Authoritative protection: If player does not exist, is archived, or is NOT READY, return 404
  if (!profile) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <ScoutPlayerProfileView profile={profile} />
    </AppShell>
  );
}
