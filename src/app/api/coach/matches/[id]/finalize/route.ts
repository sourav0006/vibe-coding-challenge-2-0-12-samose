import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { MatchService } from "@/lib/services";
import { objectIdSchema } from "@/lib/validation";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCoach();

    const { id } = await params;
    const idValidation = objectIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid match ID format." },
        { status: 400 }
      );
    }

    const finalizedMatch = await MatchService.finalizeMatch(id);

    try {
      revalidatePath("/dashboard/coach/readiness");
      revalidatePath("/dashboard/coach");
      revalidatePath("/dashboard/coach/matches");
      revalidatePath(`/dashboard/coach/matches/${id}`);
      revalidatePath("/dashboard/scout/discover");
      revalidatePath("/dashboard/player/matches");
      revalidatePath("/dashboard/player");
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: finalizedMatch,
        message: "Match finalized successfully. Scores and roster are now permanently immutable.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to finalize match.";
    const status = message.includes("not found")
      ? 404
      : message.startsWith("Validation Error:") || message.includes("Cannot finalize") || message.includes("already finalized")
      ? 400
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
