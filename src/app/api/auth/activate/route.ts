import { NextResponse, type NextRequest } from "next/server";
import { activateAccountSchema } from "@/lib/validation";
import { AuthService } from "@/lib/services";
import { activationRateLimiter } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await request.json().catch(() => null);

    const parseResult = activateAccountSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue ? firstIssue.message : "Invalid activation request data",
        },
        { status: 400 }
      );
    }

    const { email, code, password } = parseResult.data;
    const rateLimitKey = `activate:${ip}`;

    // Rate limiting check
    const rateLimit = activationRateLimiter.check(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many activation attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Activate account
    const user = await AuthService.activateAccount({ email, code, password });

    // Reset rate limiter on success
    activationRateLimiter.reset(rateLimitKey);

    return NextResponse.json(
      {
        success: true,
        message: "Account activated successfully. You can now log in with your new password.",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
