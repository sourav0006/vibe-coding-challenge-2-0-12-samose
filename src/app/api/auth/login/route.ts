import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation";
import { AuthService, RoleMismatchError } from "@/lib/services";
import { createSessionToken, setSessionCookie, loginRateLimiter } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let rateLimitKey = "";
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await request.json().catch(() => null);

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue ? firstIssue.message : "Invalid login request data",
        },
        { status: 400 }
      );
    }

    const { email, password, requestedRole } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    rateLimitKey = `login:${ip}:${normalizedEmail}`;

    // Rate limiting check (asynchronous with MongoDB fallback)
    const rateLimit = await loginRateLimiter.checkAsync(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Authenticate credentials
    const user = await AuthService.authenticate({ email: normalizedEmail, password, requestedRole });

    // Clear rate limit on successful authentication
    await loginRateLimiter.resetAsync(rateLimitKey);

    // Create JWT and set HTTP-only cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof RoleMismatchError) {
      // Refund the rate-limit penalty so selecting the wrong role does not consume password attempts
      if (rateLimitKey) {
        await loginRateLimiter.refundAsync(rateLimitKey);
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          roleMismatch: true,
          expectedRole: error.actualRole,
        },
        { status: 403 }
      );
    }

    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 401 }
    );
  }
}

