import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { MatchService } from "@/lib/services";
import { createMatchSchema, matchQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireCoach();

    const searchParams = request.nextUrl.searchParams;
    const query = {
      sportId: searchParams.get("sportId") || undefined,
      status: (searchParams.get("status") as "all" | "draft" | "finalized") || "all",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    };

    const parsedQuery = matchQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid match query parameters." },
        { status: 400 }
      );
    }

    const result = await MatchService.findMatchesPaginated(parsedQuery.data);

    return NextResponse.json(
      {
        success: true,
        data: result.matches,
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
      { success: false, error: "Failed to fetch matches." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCoach();

    const body = await request.json().catch(() => null);
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid match creation data.",
        },
        { status: 400 }
      );
    }

    const match = await MatchService.createMatch(parsed.data);

    try {
      revalidatePath("/dashboard/coach/matches");
      revalidatePath("/dashboard/coach");
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: {
          id: match._id.toString(),
          title: match.title,
          sportId: match.sportId.toString(),
          matchDate: match.matchDate,
          opponentName: match.opponentName,
          status: match.status,
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
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
    const message = error instanceof Error ? error.message : "Failed to create match.";
    const isConflict = message.startsWith("Conflict:") || (error as { code?: number })?.code === 11000;
    const isValidation = message.startsWith("Validation Error:");
    const status = isConflict ? 409 : isValidation ? 400 : 500;
    const cleanError = isConflict && (error as { code?: number })?.code === 11000
      ? "A match with this title already exists against this opponent in this sport on the selected date. Please use a different match title."
      : message.replace(/^(Conflict|Validation Error):\s*/, "");

    return NextResponse.json({ success: false, error: cleanError }, { status });
  }
}
