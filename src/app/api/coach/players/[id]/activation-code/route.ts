import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { PlayerService } from "@/lib/services";
import { objectIdSchema } from "@/lib/validation";

export async function POST(
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

    const result = await PlayerService.regenerateActivationCode(id);

    return NextResponse.json(
      {
        success: true,
        data: {
          code: result.code,
          expiresAt: result.expiresAt.toISOString(),
          player: result.player,
          message: "New activation code generated successfully. Share this single-use code directly with the player.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to regenerate activation code.";
    const status = message.startsWith("Conflict:") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
