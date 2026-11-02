import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { SportService } from "@/lib/services";
import { updateSportSchema, objectIdSchema } from "@/lib/validation";

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
        { success: false, error: "Invalid sport ID format." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateSportSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid sport update data.",
        },
        { status: 400 }
      );
    }

    const updatedSport = await SportService.update(id, parsed.data);

    if (!updatedSport) {
      return NextResponse.json(
        { success: false, error: "Sport not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedSport._id.toString(),
          name: updatedSport.name,
          normalizedName: updatedSport.normalizedName,
          description: updatedSport.description,
          isActive: updatedSport.isActive,
          createdAt: updatedSport.createdAt,
          updatedAt: updatedSport.updatedAt,
        },
        message: "Sport updated successfully.",
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
    const message = error instanceof Error ? error.message : "Failed to update sport.";
    const status = message.startsWith("Conflict:") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
