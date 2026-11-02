import { NextResponse } from "next/server";
import { requirePlayer, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { PlayerPortalService } from "@/lib/services";

export async function GET() {
  try {
    const user = await requirePlayer();
    const data = await PlayerPortalService.getPlayerDashboard(user.id);

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
      { success: false, error: "Failed to load athlete dashboard overview." },
      { status: 500 }
    );
  }
}
