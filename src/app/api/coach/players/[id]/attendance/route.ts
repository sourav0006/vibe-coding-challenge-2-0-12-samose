import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { AttendanceService } from "@/lib/services";
import { objectIdSchema } from "@/lib/validation";

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

    const stats = await AttendanceService.getPlayerAttendanceStats(id);
    if (!stats) {
      return NextResponse.json(
        { success: false, error: "Player profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: stats,
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
      { success: false, error: "Failed to fetch player attendance statistics." },
      { status: 500 }
    );
  }
}
