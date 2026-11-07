import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { MatchService } from "@/lib/services";
import { MatchDetailView } from "@/features/matches";
import { objectIdSchema } from "@/lib/validation";
import DashboardLoading from "@/app/(dashboard)/loading";

interface MatchDetailPageProps {
  params: Promise<{ id: string }>;
}

async function MatchDetailContent({
  params,
}: MatchDetailPageProps) {
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

  let matchDetails = null;

  try {
    matchDetails = await MatchService.getMatchDetails(id);
  } catch (err) {
    console.error("Failed to load match details on server:", err);
  }

  if (!matchDetails) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <MatchDetailView initialDetails={matchDetails} />
    </AppShell>
  );
}

export default function MatchDetailPage(props: MatchDetailPageProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <MatchDetailContent {...props} />
    </Suspense>
  );
}
