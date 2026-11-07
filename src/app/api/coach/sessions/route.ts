import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { SessionService } from "@/lib/services";
import { createPracticeSessionSchema, sessionQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireCoach();

    const searchParams = request.nextUrl.searchParams;
    const query = {
      sportId: searchParams.get("sportId") || undefined,
      status: (searchParams.get("status") as "all" | "open" | "closed") || "all",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    };

    const parsedQuery = sessionQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid session query parameters." },
        { status: 400 }
      );
    }

    const result = await SessionService.findSessionsPaginated(parsedQuery.data);

    return NextResponse.json(
      {
        success: true,
        data: result.sessions,
        pagination: result.pagination,
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
      { success: false, error: "Failed to fetch practice sessions." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCoach();

    const body = await request.json().catch(() => null);
    const parsed = createPracticeSessionSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid practice session creation data.",
        },
        { status: 400 }
      );
    }

    const session = await SessionService.create(parsed.data);

    try {
      revalidatePath("/dashboard/coach/sessions");
      revalidatePath("/dashboard/coach");
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: {
          id: session._id.toString(),
          sportId: session.sportId.toString(),
          sessionDate: session.sessionDate,
          status: session.status,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
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
    const message = error instanceof Error ? error.message : "Failed to create practice session.";
    const status = message.startsWith("Conflict:")
      ? 409
      : message.startsWith("Validation Error:")
      ? 400
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
