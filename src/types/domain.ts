/**
 * Domain entity types for One Academy sports management
 * Establishes typed contracts for future database models and feature modules
 */

export type UserRole = "coach" | "player" | "scout" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type SportType = "football" | "basketball" | "tennis" | "swimming" | "athletics" | "cricket";

export interface Sport {
  id: string;
  name: string;
  type: SportType;
  description?: string;
  isActive: boolean;
}

export interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sportId: string;
  jerseyNumber?: number;
  position?: string;
  emergencyContact?: string;
  status: "active" | "injured" | "inactive";
  joinedDate: string;
}

export type SessionType = "training" | "scrimmage" | "fitness" | "recovery" | "tactical";

export interface Session {
  id: string;
  sportId: string;
  title: string;
  type: SessionType;
  startTime: string;
  endTime: string;
  location: string;
  coachId: string;
  notes?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  playerId: string;
  status: AttendanceStatus;
  recordedAt: string;
  notes?: string;
}

export interface Match {
  id: string;
  sportId: string;
  opponent: string;
  date: string;
  location: string;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
}

export interface ReadinessScore {
  id: string;
  playerId: string;
  date: string;
  sleepQuality: number; // 1-5 scale
  muscleSoreness: number; // 1-5 scale
  energyLevel: number; // 1-5 scale
  stressLevel: number; // 1-5 scale
  overallScore: number; // 0-100 calculated
  notes?: string;
}
