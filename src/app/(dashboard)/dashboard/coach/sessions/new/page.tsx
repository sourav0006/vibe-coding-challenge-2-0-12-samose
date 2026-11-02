import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout";
import { SportService } from "@/lib/services";
import { CreateSessionForm } from "@/features/sessions";

export const instant = false;

export default async function CreateSessionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?role=coach");
  }

  if (user.role !== "coach") {
    redirect("/login?error=unauthorized_role");
  }

  let sportsList: Array<{ id: string; name: string; isActive?: boolean }> = [];

  try {
    const activeSports = await SportService.findAllActive();
    sportsList = activeSports.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      isActive: s.isActive,
    }));
  } catch (err) {
    console.error("Failed to load active sports on server:", err);
  }

  return (
    <AppShell user={user}>
      <CreateSessionForm sportsList={sportsList} />
    </AppShell>
  );
}
