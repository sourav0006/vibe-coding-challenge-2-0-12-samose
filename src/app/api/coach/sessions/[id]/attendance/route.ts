import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { SessionService, AttendanceService } from "@/lib/services";
import { objectIdSchema, updateSessionAttendanceSchema, markAttendanceSchema } from "@/lib/validation";

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
        { success: false, error: "Invalid session ID format." },
        { status: 400 }
      );
    }

    const sheet = await SessionService.getAttendanceSheet(id);
    if (!sheet) {
      return NextResponse.json(
        { success: false, error: "Practice session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: sheet,
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
      { success: false, error: "Failed to fetch attendance sheet." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAttendanceUpdate(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAttendanceUpdate(request, params);
}

async function handleAttendanceUpdate(
  request: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    await requireCoach();

    const { id: sessionId } = await paramsPromise;
    const idValidation = objectIdSchema.safeParse(sessionId);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID format." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    // Support both batch updates { records: [...] } and single mark { playerId, status }
    let recordsToUpdate: Array<{ playerId: string; status: "present" | "absent" }> = [];

    if (body && Array.isArray(body.records)) {
      const parsedBatch = updateSessionAttendanceSchema.safeParse(body);
      if (!parsedBatch.success) {
        const issue = parsedBatch.error.issues[0];
        return NextResponse.json(
          { success: false, error: issue ? issue.message : "Invalid attendance batch format." },
          { status: 400 }
        );
      }
      recordsToUpdate = parsedBatch.data.records;
    } else {
      const parsedSingle = markAttendanceSchema.safeParse({
        sessionId,
        playerId: body?.playerId,
        status: body?.status,
      });
      if (!parsedSingle.success) {
        const issue = parsedSingle.error.issues[0];
        return NextResponse.json(
          { success: false, error: issue ? issue.message : "Invalid attendance record format." },
          { status: 400 }
        );
      }
      recordsToUpdate = [{ playerId: parsedSingle.data.playerId, status: parsedSingle.data.status }];
    }

    await AttendanceService.recordSessionAttendance(sessionId, recordsToUpdate);

    // Return the refreshed attendance sheet
    const updatedSheet = await SessionService.getAttendanceSheet(sessionId);

    return NextResponse.json(
      {
        success: true,
        data: updatedSheet,
        message: "Attendance updated successfully.",
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
    const message = error instanceof Error ? error.message : "Failed to record attendance.";
    const status = message.startsWith("Validation Error:") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
