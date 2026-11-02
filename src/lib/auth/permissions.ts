import type { UserRole } from "@/models";

export const USER_ROLES: readonly UserRole[] = ["coach", "player", "scout"] as const;

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  coach: "/dashboard/coach",
  player: "/dashboard/player",
  scout: "/dashboard/scout",
};

/**
 * Checks if a user's role satisfies the required role constraint.
 */
export function isRoleAuthorized(
  userRole: UserRole,
  requiredRoles: UserRole | readonly UserRole[]
): boolean {
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  return userRole === requiredRoles;
}

/**
 * Returns the default dashboard path for a given role.
 */
export function getDefaultDashboardForRole(role: UserRole): string {
  return ROLE_DASHBOARDS[role] || "/";
}
