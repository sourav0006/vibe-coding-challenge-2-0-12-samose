import { NextResponse } from "next/server";
import { requireScout, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { ReadinessService } from "@/lib/services";

export async function GET() {
  try {
    await requireScout();

    const result = await ReadinessService.getScoutReadyPlayers({ page: 1, limit: 1 });

    return NextResponse.json(
      {
        success: true,
        data: result.availableSports,
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
      { success: false, error: "Failed to load sports." },
      { status: 500 }
    );
  }
}
