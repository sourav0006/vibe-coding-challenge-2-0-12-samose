import { NextResponse, type NextRequest } from "next/server";
import { requireScout, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { ReadinessService } from "@/lib/services";
import { scoutQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    // 1. Authoritative Scout Role Guard
    await requireScout();

    // 2. Parse & Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = {
      sportId: searchParams.get("sportId") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    };

    const parsedQuery = scoutQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    // 3. Retrieve only verified READY players with dynamic sport discovery
    const result = await ReadinessService.getScoutReadyPlayers(parsedQuery.data);

    return NextResponse.json(
      {
        success: true,
        data: result.players,
        pagination: result.pagination,
        totalReadyCount: result.totalReadyCount,
        availableSports: result.availableSports,
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
      { success: false, error: "Failed to discover players." },
      { status: 500 }
    );
  }
}
