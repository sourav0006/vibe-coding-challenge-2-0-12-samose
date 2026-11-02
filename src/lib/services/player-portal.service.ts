import { connectToDatabase } from "@/lib/db";
import {
  PlayerModel,
  type IPlayer,
} from "@/models";
import { AttendanceService, type PlayerAttendanceRecordDTO } from "./attendance.service";
import { MatchService } from "./match.service";
import { ReadinessService } from "./readiness.service";
import { RemarkService, type SafeCoachRemarkDTO } from "./remark.service";
import { AuthorizationError } from "@/lib/auth/guards";
import type { Types } from "mongoose";

export interface SafePlayerProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  age: number;
  sportId: string;
  sportName: string;
  isActive: boolean;
  isActivated: boolean;
  dateJoined: string;
}

export interface PlayerDashboardOverviewDTO {
  profile: SafePlayerProfileDTO;
  attendance: {
    attendancePercentage: string; // e.g. "85.0%" or "N/A"
    numericPercentage: number | null;
    totalApplicableClosedSessions: number;
    presentSessions: number;
    absentSessions: number;
  };
  matches: {
    finalizedMatchesPlayed: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
  readiness: {
    status: "ready" | "not_ready";
    isReady: boolean;
    attendanceCriterionMet: boolean;
    matchCriterionMet: boolean;
    reasons: string[];
  };
  recentRemarks: SafeCoachRemarkDTO[];
}

export interface PlayerAttendanceHistoryResult {
  attendancePercentage: string;
  numericPercentage: number | null;
  totalApplicableClosedSessions: number;
  presentSessions: number;
  absentSessions: number;
  history: PlayerAttendanceRecordDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PlayerMatchHistoryResult {
  totalMatchesPlayed: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  history: Array<{
    matchId: string;
    matchDate: Date;
    sportName: string;
    opponentName: string;
    score: number;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PopulatedPlayerDoc extends Omit<IPlayer, "userId" | "sportId"> {
  _id: Types.ObjectId;
  fullName: string;
  age: number;
  isActive: boolean;
  userId: { _id: Types.ObjectId; email: string; isActive: boolean; createdAt: Date };
  sportId?: { _id: Types.ObjectId; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PlayerPortalService {
  /**
   * Resolves the Player record strictly bound to the authenticated User ID.
   * Throws AuthorizationError if no active Player profile exists.
   */
  static async resolvePlayerForUser(userId: string): Promise<PopulatedPlayerDoc> {
    await connectToDatabase();

    const player = await PlayerModel.findOne({ userId })
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .populate<{ userId: { _id: Types.ObjectId; email: string; isActive: boolean; createdAt: Date } }>(
        "userId",
        "email isActive createdAt"
      )
      .exec();

    if (!player) {
      throw new AuthorizationError(
        "Athlete profile not found. Your user account is not linked to an active player roster."
      );
    }

    if (!player.isActive) {
      throw new AuthorizationError(
        "Your player profile has been archived. Please contact academy staff for assistance."
      );
    }

    return player as unknown as PopulatedPlayerDoc;
  }

  /**
   * Builds the comprehensive Player Dashboard Overview using authoritative services.
   */
  static async getPlayerDashboard(userId: string): Promise<PlayerDashboardOverviewDTO> {
    const player = await this.resolvePlayerForUser(userId);
    const playerId = player._id.toString();

    const [attendanceStats, matchStats, readinessEvaluation, remarksDocs] = await Promise.all([
      AttendanceService.getPlayerAttendanceStats(playerId),
      MatchService.getPlayerMatchStats(playerId),
      ReadinessService.getPlayerReadiness(playerId),
      RemarkService.findByPlayer(playerId, 5),
    ]);

    const sportObj = player.sportId as unknown as { _id: Types.ObjectId; name: string } | undefined;
    const userObj = player.userId as unknown as { _id: Types.ObjectId; email: string; createdAt: Date } | undefined;

    const profile: SafePlayerProfileDTO = {
      id: playerId,
      userId,
      fullName: player.fullName,
      email: userObj?.email || "",
      age: player.age,
      sportId: sportObj?._id ? sportObj._id.toString() : "",
      sportName: sportObj?.name || "Unassigned",
      isActive: player.isActive,
      isActivated: true, // If logged in and authenticated, user is activated
      dateJoined: (userObj?.createdAt || player.createdAt).toISOString(),
    };

    return {
      profile,
      attendance: {
        attendancePercentage: attendanceStats ? attendanceStats.attendancePercentage : "N/A",
        numericPercentage: attendanceStats ? attendanceStats.percentageValue : null,
        totalApplicableClosedSessions: attendanceStats ? attendanceStats.totalSessions : 0,
        presentSessions: attendanceStats ? attendanceStats.presentCount : 0,
        absentSessions: attendanceStats ? attendanceStats.absentCount : 0,
      },
      matches: {
        finalizedMatchesPlayed: matchStats ? matchStats.totalMatchesPlayed : 0,
        averageScore: matchStats ? matchStats.averageScore : null,
        highestScore: matchStats ? matchStats.highestScore : null,
        lowestScore: matchStats ? matchStats.lowestScore : null,
      },
      readiness: {
        status: readinessEvaluation?.readinessStatus || "not_ready",
        isReady: readinessEvaluation?.isReady || false,
        attendanceCriterionMet: readinessEvaluation?.attendanceCriterionMet || false,
        matchCriterionMet: readinessEvaluation?.matchCriterionMet || false,
        reasons: readinessEvaluation?.readinessReasons || [
          "Attendance requirement requires at least 75% in applicable closed sessions.",
          "Match requirement requires participation in at least 2 finalized matches.",
        ],
      },
      recentRemarks: remarksDocs.map((r) => RemarkService.toSafeDTO(r)),
    };
  }

  /**
   * Retrieves safe personal profile information for the authenticated player.
   */
  static async getPlayerProfile(userId: string): Promise<SafePlayerProfileDTO> {
    const player = await this.resolvePlayerForUser(userId);
    const sportObj = player.sportId as unknown as { _id: Types.ObjectId; name: string } | undefined;
    const userObj = player.userId as unknown as { _id: Types.ObjectId; email: string; createdAt: Date } | undefined;

    return {
      id: player._id.toString(),
      userId,
      fullName: player.fullName,
      email: userObj?.email || "",
      age: player.age,
      sportId: sportObj?._id ? sportObj._id.toString() : "",
      sportName: sportObj?.name || "Unassigned",
      isActive: player.isActive,
      isActivated: true,
      dateJoined: (userObj?.createdAt || player.createdAt).toISOString(),
    };
  }

  /**
   * Retrieves official attendance history for the authenticated player with pagination.
   */
  static async getPlayerAttendanceHistory(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PlayerAttendanceHistoryResult> {
    const player = await this.resolvePlayerForUser(userId);
    const playerId = player._id.toString();

    const attendanceStats = await AttendanceService.getPlayerAttendanceStats(playerId);

    const allHistory = attendanceStats ? attendanceStats.history : [];
    const total = allHistory.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;

    const paginated = allHistory.slice((page - 1) * limit, page * limit);

    return {
      attendancePercentage: attendanceStats ? attendanceStats.attendancePercentage : "N/A",
      numericPercentage: attendanceStats ? attendanceStats.percentageValue : null,
      totalApplicableClosedSessions: attendanceStats ? attendanceStats.totalSessions : 0,
      presentSessions: attendanceStats ? attendanceStats.presentCount : 0,
      absentSessions: attendanceStats ? attendanceStats.absentCount : 0,
      history: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves finalized match history and individual performance for the authenticated player.
   */
  static async getPlayerMatchHistory(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PlayerMatchHistoryResult> {
    const player = await this.resolvePlayerForUser(userId);
    const playerId = player._id.toString();

    const matchStats = await MatchService.getPlayerMatchStats(playerId);

    const allHistory = matchStats ? matchStats.history : [];
    const total = allHistory.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;

    const paginated = allHistory.slice((page - 1) * limit, page * limit);

    return {
      totalMatchesPlayed: matchStats ? matchStats.totalMatchesPlayed : 0,
      averageScore: matchStats ? matchStats.averageScore : null,
      highestScore: matchStats ? matchStats.highestScore : null,
      lowestScore: matchStats ? matchStats.lowestScore : null,
      history: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves coach remarks and feedback for the authenticated player.
   */
  static async getPlayerRemarks(
    userId: string,
    limit = 50
  ): Promise<SafeCoachRemarkDTO[]> {
    const player = await this.resolvePlayerForUser(userId);
    const remarks = await RemarkService.findByPlayer(player._id.toString(), limit);
    return remarks.map((r) => RemarkService.toSafeDTO(r));
  }
}
