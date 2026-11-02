import { NextResponse, type NextRequest } from "next/server";
import { issueActivationCodeSchema } from "@/lib/validation";
import { AuthService } from "@/lib/services";
import { requireCoach, AuthenticationError, AuthorizationError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Only Coach is permitted to generate and retrieve activation codes
    await requireCoach();

    const body = await request.json().catch(() => null);

    const parseResult = issueActivationCodeSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue ? firstIssue.message : "Invalid activation code request",
        },
        { status: 400 }
      );
    }

    const { userId, expiresInHours } = parseResult.data;

    const result = await AuthService.issueActivationCode(userId, expiresInHours);

    return NextResponse.json(
      {
        success: true,
        data: {
          code: result.code,
          expiresAt: result.expiresAt.toISOString(),
          message: "Activation code generated successfully. Share this single-use code directly with the user.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to issue activation code";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
