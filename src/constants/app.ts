/**
 * Application-wide constants for One Academy
 */

export const APP_CONFIG = {
  name: "One Academy",
  shortName: "OneAcademy",
  tagline: "Sports Academy Management System",
  description:
    "A modern, unified platform for sports academies to manage coaches, athletes, schedules, readiness, and performance.",
  version: "0.5.0",
  currentPhase: "Phase 5: Coach Dashboard & Player Management",
} as const;

export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/login",
  },
  DASHBOARD: {
    ROOT: "/dashboard",
    PLAYERS: "/players",
    SPORTS: "/sports",
    ATTENDANCE: "/attendance",
    SESSIONS: "/sessions",
    MATCHES: "/matches",
    READINESS: "/readiness",
  },
} as const;
