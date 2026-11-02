import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { MatchService } from "@/lib/services";
import {
  objectIdSchema,
  addMatchParticipantSchema,
  batchUpdateParticipantsSchema,
} from "@/lib/validation";

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
        data: {
          participants: matchDetails.participants,
          eligibleRoster: matchDetails.eligibleRoster,
          sameDaySession: matchDetails.sameDaySession,
          stats: matchDetails.stats,
        },
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
      { success: false, error: "Failed to fetch match participants." },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Support both single participant and batch
    if (body && Array.isArray(body.participants)) {
      const parsedBatch = batchUpdateParticipantsSchema.safeParse(body);
      if (!parsedBatch.success) {
        const issue = parsedBatch.error.issues[0];
        return NextResponse.json(
          {
            success: false,
            error: issue ? issue.message : "Invalid participants batch data.",
          },
          { status: 400 }
        );
      }
      const result = await MatchService.saveParticipantsBatch(id, parsedBatch.data.participants);
      return NextResponse.json(
        {
          success: true,
          data: result,
          message: "Participants updated successfully.",
        },
        { status: 200 }
      );
    }

    const parsedSingle = addMatchParticipantSchema.safeParse(body);
    if (!parsedSingle.success) {
      const issue = parsedSingle.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid participant data. Score must be between 0 and 10.",
        },
        { status: 400 }
      );
    }

    const participant = await MatchService.addOrUpdateParticipant(
      id,
      parsedSingle.data.playerId,
      parsedSingle.data.score
    );

    return NextResponse.json(
      {
        success: true,
        data: participant,
        message: "Participant recorded successfully.",
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
    const message = error instanceof Error ? error.message : "Failed to record participant.";
    const status = message.startsWith("Validation Error:") || message.includes("Cannot add") || message.includes("ineligible")
      ? 400
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PUT(
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
    const parsed = batchUpdateParticipantsSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid participant batch update data.",
        },
        { status: 400 }
      );
    }

    const result = await MatchService.saveParticipantsBatch(id, parsed.data.participants);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Participants updated successfully.",
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
    const message = error instanceof Error ? error.message : "Failed to update participants.";
    const status = message.startsWith("Validation Error:") || message.includes("Cannot modify") || message.includes("ineligible")
      ? 400
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
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

    // Check search params or json body for playerId
    const searchParams = request.nextUrl.searchParams;
    let playerId = searchParams.get("playerId");

    if (!playerId) {
      const body = await request.json().catch(() => null);
      if (body && typeof body.playerId === "string") {
        playerId = body.playerId;
      }
    }

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "Player ID is required to remove participant." },
        { status: 400 }
      );
    }

    const pValidation = objectIdSchema.safeParse(playerId);
    if (!pValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid Player ID format." },
        { status: 400 }
      );
    }

    await MatchService.removeParticipant(id, playerId);

    return NextResponse.json(
      {
        success: true,
        message: "Participant removed successfully from match.",
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
    const message = error instanceof Error ? error.message : "Failed to remove participant.";
    const status = message.startsWith("Validation Error:") || message.includes("Cannot remove")
      ? 400
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
