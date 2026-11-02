import { NextResponse } from "next/server";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";
import { DashboardService } from "@/lib/services";

export async function GET() {
  try {
    await requireCoach();

    const codes = await DashboardService.getActivationCodesMetadata();

    return NextResponse.json(
      {
        success: true,
        data: codes,
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
      { success: false, error: "Failed to retrieve activation code metadata." },
      { status: 500 }
    );
  }
}
