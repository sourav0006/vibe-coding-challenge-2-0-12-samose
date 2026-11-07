import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { ScoutService } from "@/lib/services";
import { createScoutAccountSchema, scoutListQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireCoach();

    const searchParams = request.nextUrl.searchParams;
    const query = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as "all" | "active" | "pending" | "archived") || "all",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10,
    };

    const parsedQuery = scoutListQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid scout query parameters." },
        { status: 400 }
      );
    }

    const result = await ScoutService.findScoutsPaginated(parsedQuery.data);

    return NextResponse.json(
      {
        success: true,
        data: result.scouts,
        scouts: result.scouts,
        pagination: result.pagination,
        stats: result.stats,
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
      { success: false, error: "Failed to fetch scouts list." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCoach();

    const body = await request.json().catch(() => null);
    const parsed = createScoutAccountSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid scout creation data.",
        },
        { status: 400 }
      );
    }

    const result = await ScoutService.createScoutWithAccount(parsed.data);

    try {
      revalidatePath("/dashboard/coach/scouts");
      revalidatePath("/dashboard/coach");
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: {
          scout: {
            id: result.scout._id.toString(),
            fullName: result.scout.fullName,
            isActive: result.scout.isActive,
            createdAt: result.scout.createdAt,
          },
          user: {
            id: result.userId,
            email: result.email,
          },
          // Plaintext activation code returned ONCE to the coach for the activation modal
          activationCode: result.activationCode,
          expiresAt: result.expiresAt.toISOString(),
          message: "Scout account created successfully. Provide the activation code securely to the scout.",
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
    const message = error instanceof Error ? error.message : "Failed to create scout account.";
    const status = message.startsWith("Conflict:") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
