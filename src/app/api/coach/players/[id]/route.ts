import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { PlayerService } from "@/lib/services";
import { updatePlayerDetailsSchema, objectIdSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
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

    const player = await PlayerService.getPlayerDetails(id);

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: player,
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
    return NextResponse.json(
      { success: false, error: "Failed to retrieve player profile." },
      { status: 500 }
    );
  }
}

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
    const parsed = updatePlayerDetailsSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid player update data.",
        },
        { status: 400 }
      );
    }

    const updated = await PlayerService.updatePlayerDetails(id, parsed.data);

    if (!updated) {
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
        message: "Player profile updated successfully.",
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
    const message = error instanceof Error ? error.message : "Failed to update player.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
