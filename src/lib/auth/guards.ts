import { getSessionToken } from "./session";
import { verifySessionToken } from "./token";
import { connectToDatabase } from "@/lib/db";
import { UserModel, type UserRole } from "@/models";
import { isRoleAuthorized } from "./permissions";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export class AuthenticationError extends Error {
  public readonly statusCode = 401;
  constructor(message = "Authentication required. Please log in.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  public readonly statusCode = 403;
  constructor(message = "Forbidden. You do not have permission to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Retrieves the currently authenticated user from the session cookie.
 * Verifies token validity and ensures the account exists and remains active in MongoDB.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  try {
    await connectToDatabase();
    const user = await UserModel.findById(payload.userId).exec();

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

/**
 * Enforces that the incoming request is authenticated. Throws AuthenticationError (401) if not.
 */
export async function requireAuthentication(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

/**
 * Enforces that the incoming request is authenticated and has one of the required roles.
 * Throws AuthenticationError (401) or AuthorizationError (403) accordingly.
 */
export async function requireRole(allowedRoles: UserRole | readonly UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireAuthentication();

  if (!isRoleAuthorized(user.role, allowedRoles)) {
    throw new AuthorizationError(
      `Access denied. Role "${user.role}" is not authorized for this resource.`
    );
  }

  return user;
}

/**
 * Guard restricted exclusively to Coach.
 */
export async function requireCoach(): Promise<AuthenticatedUser> {
  return requireRole("coach");
}

/**
 * Guard restricted exclusively to Player.
 */
export async function requirePlayer(): Promise<AuthenticatedUser> {
  return requireRole("player");
}

/**
 * Guard restricted exclusively to Scout.
 */
export async function requireScout(): Promise<AuthenticatedUser> {
  return requireRole("scout");
}
