import { NextResponse, type NextRequest } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { PlayerService } from "@/lib/services";
import { createPlayerAccountSchema, playerQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireCoach();

    const searchParams = request.nextUrl.searchParams;
    const query = {
      search: searchParams.get("search") || undefined,
      sportId: searchParams.get("sportId") || undefined,
      status: (searchParams.get("status") as "all" | "active" | "pending" | "archived") || "all",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10,
    };

    const parsedQuery = playerQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid player query parameters." },
        { status: 400 }
      );
    }

    const result = await PlayerService.findPlayersPaginated(parsedQuery.data);

    return NextResponse.json(
      {
        success: true,
        data: result.players,
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
      { success: false, error: "Failed to fetch players list." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCoach();

    const body = await request.json().catch(() => null);
    const parsed = createPlayerAccountSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? issue.message : "Invalid player creation data.",
        },
        { status: 400 }
      );
    }

    const result = await PlayerService.createPlayerWithAccount(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          player: {
            id: result.player._id.toString(),
            fullName: result.player.fullName,
            age: result.player.age,
            sportId: result.player.sportId.toString(),
            sportName: result.sportName,
            isActive: result.player.isActive,
            createdAt: result.player.createdAt,
          },
          user: {
            id: result.userId,
            email: result.email,
          },
          // Plaintext activation code returned ONCE to the coach for the activation modal
          activationCode: result.activationCode,
          expiresAt: result.expiresAt.toISOString(),
          message: "Player account created successfully. Provide the activation code securely to the player.",
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
    const message = error instanceof Error ? error.message : "Failed to create player.";
    const status = message.startsWith("Conflict:") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
