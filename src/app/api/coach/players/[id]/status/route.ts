import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { PlayerService } from "@/lib/services";
import { updatePlayerStatusSchema, objectIdSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCoach();

    const { id } = await params;
    const idValidation = objectIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID format." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updatePlayerStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status payload. 'isActive' boolean is required." },
        { status: 400 }
      );
    }

    // archive: true means deactivating (isActive: false)
    const archive = !parsed.data.isActive;
    const player = await PlayerService.togglePlayerArchival(id, archive);

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found." },
        { status: 404 }
      );
    }

    const refreshed = await PlayerService.getPlayerDetails(id);

    return NextResponse.json(
      {
        success: true,
        data: refreshed,
        message: archive
          ? "Player archived successfully. The player account has been deactivated."
          : "Player unarchived successfully.",
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
    const message = error instanceof Error ? error.message : "Failed to toggle player status.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
