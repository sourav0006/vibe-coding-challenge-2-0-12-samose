import { NextResponse } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { DashboardService } from "@/lib/services";

export async function GET() {
  try {
    await requireCoach();

    const [stats, recentPlayers, recentMatches] = await Promise.all([
      DashboardService.getCoachStats(),
      DashboardService.getRecentPlayers(5),
      DashboardService.getRecentMatches(5),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          stats,
          recentPlayers,
          recentMatches,
        },
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
      { success: false, error: "Failed to retrieve dashboard statistics." },
      { status: 500 }
    );
  }
}
