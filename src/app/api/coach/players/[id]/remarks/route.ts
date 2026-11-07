import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { RemarkService, PlayerService } from "@/lib/services";
import { objectIdSchema, coachRemarkPayloadSchema } from "@/lib/validation";

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
        { success: false, error: "Player profile not found." },
        { status: 404 }
      );
    }

    const remarks = await RemarkService.findByPlayer(id);
    const data = remarks.map((r) => RemarkService.toSafeDTO(r));

    return NextResponse.json(
      {
        success: true,
        data,
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
      { success: false, error: "Failed to retrieve coach remarks." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCoach();

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
        { success: false, error: "Player profile not found." },
        { status: 404 }
      );
    }

    const rawBody = await request.json();
    const parsedBody = coachRemarkPayloadSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      const issue = parsedBody.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue ? issue.message : "Invalid remark content." },
        { status: 400 }
      );
    }

    const created = await RemarkService.create({
      playerId: id,
      content: parsedBody.data.content,
      coachId: user.id,
    });

    try {
      revalidatePath(`/dashboard/coach/players/${id}`);
      revalidatePath("/dashboard/player/remarks");
      revalidatePath("/dashboard/player");
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: RemarkService.toSafeDTO(created),
        message: "Coach remark saved successfully.",
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record coach remark.",
      },
      { status: 500 }
    );
  }
}
