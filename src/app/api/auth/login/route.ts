import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation";
import { AuthService } from "@/lib/services";
import { createSessionToken, setSessionCookie, loginRateLimiter } from "@/lib/auth";

export async function POST(request: NextRequest) {
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
    const rateLimitKey = `login:${ip}:${email}`;

    // Rate limiting check
    const rateLimit = loginRateLimiter.check(rateLimitKey);
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
    const user = await AuthService.authenticate({ email, password, requestedRole });

    // Clear rate limit on successful authentication
    loginRateLimiter.reset(rateLimitKey);

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
