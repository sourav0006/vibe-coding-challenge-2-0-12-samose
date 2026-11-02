import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { ReadinessService } from "@/lib/services";
import { readinessQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireCoach();

    const searchParams = request.nextUrl.searchParams;
    const query = {
      sportId: searchParams.get("sportId") || undefined,
      status: (searchParams.get("status") as "all" | "ready" | "not_ready") || "all",
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as "attendance" | "matches" | "name") || "name",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    };

    const parsedQuery = readinessQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid readiness query parameters." },
        { status: 400 }
      );
    }

    const result = await ReadinessService.getCoachReadinessList(parsedQuery.data);

    return NextResponse.json(
      {
        success: true,
        data: result.players,
        pagination: result.pagination,
        stats: result.stats,
        sportsList: result.sportsList,
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
      { success: false, error: "Failed to load readiness overview." },
      { status: 500 }
    );
  }
}
