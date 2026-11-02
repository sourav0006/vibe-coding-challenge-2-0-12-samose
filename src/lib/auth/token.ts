import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/models";

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const DEFAULT_EXPIRATION = "7d";
const JWT_ALGORITHM = "HS256";

/**
 * Retrieves the cryptographic key derived from AUTH_SECRET.
 */
function getAuthSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === "test") {
      return new TextEncoder().encode("test-secret-at-least-32-characters-long-key-12345");
    }
    throw new Error("Server Configuration Error: Missing AUTH_SECRET environment variable");
  }

  if (secret.length < 32 && process.env.NODE_ENV === "production") {
    throw new Error("Security Error: AUTH_SECRET must be at least 32 characters long in production");
  }

  return new TextEncoder().encode(secret);
}

/**
 * Signs and generates a secure session JWT using jose (HS256).
 */
export async function createSessionToken(
  payload: SessionTokenPayload,
  expiresIn = DEFAULT_EXPIRATION
): Promise<string> {
  const secretKey = getAuthSecretKey();

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer("one-academy-auth")
    .setAudience("one-academy-app")
    .sign(secretKey);
}

/**
 * Verifies and decodes a session JWT. Returns null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const secretKey = getAuthSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "one-academy-auth",
      audience: "one-academy-app",
      algorithms: [JWT_ALGORITHM],
    });

    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      (payload.role === "coach" || payload.role === "player" || payload.role === "scout")
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
      };
    }

    return null;
  } catch {
    return null;
  }
}
