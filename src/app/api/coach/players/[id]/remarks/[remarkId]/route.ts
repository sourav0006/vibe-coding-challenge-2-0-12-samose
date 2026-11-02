import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { RemarkService } from "@/lib/services";
import { objectIdSchema, updateCoachRemarkSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; remarkId: string }> }
) {
  try {
    await requireCoach();

    const { id, remarkId } = await params;
    const playerValidation = objectIdSchema.safeParse(id);
    const remarkValidation = objectIdSchema.safeParse(remarkId);

    if (!playerValidation.success || !remarkValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID or remark ID format." },
        { status: 400 }
      );
    }

    const rawBody = await request.json();
    const parsedBody = updateCoachRemarkSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      const issue = parsedBody.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue ? issue.message : "Invalid remark update payload." },
        { status: 400 }
      );
    }

    // Verify remark exists and belongs to this specific player
    const updated = await RemarkService.update(remarkId, id, parsedBody.data);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Remark not found or does not belong to the specified player.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: RemarkService.toSafeDTO(updated),
        message: "Coach remark updated successfully.",
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
      { success: false, error: "Failed to update coach remark." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; remarkId: string }> }
) {
  try {
    await requireCoach();

    const { id, remarkId } = await params;
    const playerValidation = objectIdSchema.safeParse(id);
    const remarkValidation = objectIdSchema.safeParse(remarkId);

    if (!playerValidation.success || !remarkValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID or remark ID format." },
        { status: 400 }
      );
    }

    // Verify remark exists and belongs to this specific player
    const deleted = await RemarkService.delete(remarkId, id);
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Remark not found or does not belong to the specified player.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Coach remark deleted successfully.",
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
      { success: false, error: "Failed to delete coach remark." },
      { status: 500 }
    );
  }
}
