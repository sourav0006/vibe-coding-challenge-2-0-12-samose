import { NextResponse, type NextRequest } from "next/server";
import { requirePlayer, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { PlayerPortalService } from "@/lib/services";
import { paginationQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePlayer();
    const searchParams = request.nextUrl.searchParams;

    const parsedQuery = paginationQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const options = parsedQuery.success ? parsedQuery.data : { page: 1, limit: 20 };
    const data = await PlayerPortalService.getPlayerAttendanceHistory(user.id, options);

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
      { success: false, error: "Failed to load player attendance history." },
      { status: 500 }
    );
  }
}
