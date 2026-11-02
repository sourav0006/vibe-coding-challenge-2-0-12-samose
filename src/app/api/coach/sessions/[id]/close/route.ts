import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { SessionService } from "@/lib/services";
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
        { success: false, error: "Invalid session ID format." },
        { status: 400 }
      );
    }

    const closedSession = await SessionService.closeSession(id);
    if (!closedSession) {
      return NextResponse.json(
        { success: false, error: "Practice session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: closedSession._id.toString(),
          sportId: closedSession.sportId.toString(),
          sessionDate: closedSession.sessionDate,
          status: closedSession.status,
          closedAt: closedSession.closedAt,
          updatedAt: closedSession.updatedAt,
        },
        message: "Practice session closed and attendance successfully finalized.",
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
    const message = error instanceof Error ? error.message : "Failed to close practice session.";
    const status = message.startsWith("Cannot close session:") || message.startsWith("Validation Error:")
      ? 400
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
