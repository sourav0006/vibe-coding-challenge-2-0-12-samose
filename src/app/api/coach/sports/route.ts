import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { SportService } from "@/lib/services";
import { createSportSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireCoach();

    const sports = await SportService.findAllWithPlayerCounts();

    return NextResponse.json(
      {
        success: true,
        data: sports,
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
      { success: false, error: "Failed to fetch sports catalogue." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCoach();

    const body = await request.json().catch(() => null);
    const parsed = createSportSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid sport data provided.",
        },
        { status: 400 }
      );
    }

    const sport = await SportService.create(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: sport._id.toString(),
          name: sport.name,
          normalizedName: sport.normalizedName,
          description: sport.description,
          isActive: sport.isActive,
          createdAt: sport.createdAt,
          updatedAt: sport.updatedAt,
        },
        message: `Sport "${sport.name}" created successfully.`,
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
    const message = error instanceof Error ? error.message : "Failed to create sport.";
    const status = message.startsWith("Conflict:") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
