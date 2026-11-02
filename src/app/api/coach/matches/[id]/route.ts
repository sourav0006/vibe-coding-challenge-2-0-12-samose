import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { MatchService } from "@/lib/services";
import { objectIdSchema, updateMatchSchema } from "@/lib/validation";

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
        { success: false, error: "Invalid match ID format." },
        { status: 400 }
      );
    }

    const matchDetails = await MatchService.getMatchDetails(id);
    if (!matchDetails) {
      return NextResponse.json(
        { success: false, error: "Match not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: matchDetails,
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
      { success: false, error: "Failed to fetch match details." },
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
        { success: false, error: "Invalid match ID format." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateMatchSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid match update data.",
        },
        { status: 400 }
      );
    }

    const updated = await MatchService.updateMatch(id, parsed.data);
    return NextResponse.json(
      {
        success: true,
        data: updated,
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
    const message = error instanceof Error ? error.message : "Failed to update match.";
    const status = message.startsWith("Validation Error:") || message.includes("Cannot update") || message.includes("not found")
      ? (message.includes("not found") ? 404 : 400)
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
