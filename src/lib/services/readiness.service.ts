import { connectToDatabase } from "@/lib/db";
import {
  PlayerModel,
  SportModel,
  PracticeSessionModel,
  AttendanceModel,
  MatchModel,
  MatchParticipantModel,
  type IPlayer,
  type IAttendance,
  type IMatch,
} from "@/models";
import { AttendanceService } from "./attendance.service";
import type { Types } from "mongoose";
import type { ReadinessQueryInput, ScoutQueryInput } from "@/lib/validation";

export type ReadinessStatus = "ready" | "not_ready";

export interface ReadinessEvaluation {
  status: ReadinessStatus;
  isReady: boolean;
  attendanceCriterionMet: boolean;
  matchCriterionMet: boolean;
  reasons: string[];
}

export interface PlayerReadinessDTO {
  playerId: string;
  fullName: string;
  email: string;
  age: number;
  sportId: string;
  sportName: string;
  isActive: boolean;
  // Attendance metrics
  attendancePercentage: string; // e.g. "85.0%" or "N/A"
  numericAttendancePercentage: number | null; // e.g. 85.0 or null
  presentSessions: number;
  applicableClosedSessions: number;
  // Match metrics
  finalizedMatchesPlayed: number;
  averageIndividualScore: number | null;
  highestIndividualScore: number | null;
  // Readiness evaluation
  readinessStatus: ReadinessStatus;
  isReady: boolean;
  attendanceCriterionMet: boolean;
  matchCriterionMet: boolean;
  readinessReasons: string[];
}

export interface CoachReadinessStats {
  totalPlayers: number;
  totalReadyPlayers: number;
  totalNotReadyPlayers: number;
  meetingAttendanceCriterion: number;
  meetingMatchCriterion: number;
}

export interface SafeScoutPlayerDTO {
  id: string;
  fullName: string;
  age: number;
  sportId: string;
  sportName: string;
  attendancePercentage: string;
  numericAttendancePercentage: number | null;
  finalizedMatchesPlayed: number;
  averageIndividualScore: number | null;
  highestIndividualScore: number | null;
  readinessStatus: "ready";
}

export interface ScoutPlayerProfileDTO {
  player: {
    id: string;
    fullName: string;
    age: number;
    sportName: string;
    readinessStatus: "ready";
  };
  attendance: {
    attendancePercentage: string;
    presentSessions: number;
    applicableClosedSessions: number;
  };
  matches: {
    totalFinalizedMatches: number;
    averageIndividualScore: number | null;
    highestIndividualScore: number | null;
    history: Array<{
      matchId: string;
      matchDate: Date;
      sportName: string;
      opponentName: string;
      score: number;
    }>;
  };
}

export class ReadinessService {
  /**
   * Central evaluation function for determining whether a player satisfies official readiness.
   * Business Rule:
   * READY = (Attendance >= 75%) AND (Finalized Matches Played >= 2)
   * Otherwise: NOT READY
   *
   * Exact boundary requirements:
   * - Exactly 75% attendance qualifies.
   * - Exactly 2 finalized match participations qualifies.
   * - 74.9% attendance does NOT qualify.
   * - 1 finalized match does NOT qualify.
   * - 0 finalized matches does NOT qualify.
   * - Attendance of N/A (null) does NOT qualify.
   */
  static evaluateReadiness(
    numericAttendancePercentage: number | null,
    finalizedMatchesPlayed: number
  ): ReadinessEvaluation {
    const attendanceCriterionMet =
      numericAttendancePercentage !== null && numericAttendancePercentage >= 75.0;
    const matchCriterionMet = finalizedMatchesPlayed >= 2;
    const isReady = attendanceCriterionMet && matchCriterionMet;
    const status: ReadinessStatus = isReady ? "ready" : "not_ready";

    const reasons: string[] = [];

    if (attendanceCriterionMet) {
      reasons.push(
        `Attendance requirement met (${numericAttendancePercentage!.toFixed(1)}% >= 75.0%).`
      );
    } else if (numericAttendancePercentage === null) {
      reasons.push(
        "Attendance is N/A: No applicable closed practice sessions recorded for this player."
      );
    } else {
      reasons.push(
        `Attendance is ${numericAttendancePercentage.toFixed(1)}%, which is below the required 75.0% threshold.`
      );
    }

    if (matchCriterionMet) {
      reasons.push(
        `Match participation requirement met (${finalizedMatchesPlayed} finalized matches >= 2).`
      );
    } else {
      reasons.push(
        `Player has participated in ${finalizedMatchesPlayed} finalized match(es), which is below the required 2 matches.`
      );
    }

    return {
      status,
      isReady,
      attendanceCriterionMet,
      matchCriterionMet,
      reasons,
    };
  }

  /**
   * Computes readiness and performance metrics for a single player.
   */
  static async getPlayerReadiness(playerId: string): Promise<PlayerReadinessDTO | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(playerId)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .populate<{ userId: { email: string } }>("userId", "email")
      .exec();

    if (!player) {
      return null;
    }

    // 1. Calculate attendance stats using authoritative attendance engine
    const attendanceStats = await AttendanceService.getPlayerAttendanceStats(player._id.toString());
    const numericAttendancePercentage = attendanceStats ? attendanceStats.percentageValue : null;
    const attendancePercentage = attendanceStats ? attendanceStats.attendancePercentage : "N/A";
    const presentSessions = attendanceStats ? attendanceStats.presentCount : 0;
    const applicableClosedSessions = attendanceStats ? attendanceStats.totalSessions : 0;

    // 2. Calculate finalized match stats using authoritative match records
    const participantDocs = await MatchParticipantModel.find({ playerId: player._id })
      .populate<{
        matchId: IMatch & {
          sportId: { _id: Types.ObjectId; name: string };
        };
      }>({
        path: "matchId",
        populate: {
          path: "sportId",
          select: "name",
        },
      })
      .exec();

    // Filter strictly to parent matches that are finalized
    const finalizedParticipations = participantDocs.filter(
      (doc) => doc.matchId && doc.matchId.status === "finalized"
    );

    const finalizedMatchesPlayed = finalizedParticipations.length;
    let averageIndividualScore: number | null = null;
    let highestIndividualScore: number | null = null;

    if (finalizedMatchesPlayed > 0) {
      const scores = finalizedParticipations.map((p) => p.score);
      const sum = scores.reduce((acc, s) => acc + s, 0);
      averageIndividualScore = Number((sum / finalizedMatchesPlayed).toFixed(1));
      highestIndividualScore = Math.max(...scores);
    }

    // 3. Centralized readiness evaluation
    const evaluation = this.evaluateReadiness(
      numericAttendancePercentage,
      finalizedMatchesPlayed
    );

    const email = (player.userId as { email?: string })?.email || "Unknown";

    return {
      playerId: player._id.toString(),
      fullName: player.fullName,
      email,
      age: player.age,
      sportId: player.sportId ? player.sportId._id.toString() : "",
      sportName: player.sportId?.name || "Unassigned",
      isActive: player.isActive,
      attendancePercentage,
      numericAttendancePercentage,
      presentSessions,
      applicableClosedSessions,
      finalizedMatchesPlayed,
      averageIndividualScore,
      highestIndividualScore,
      readinessStatus: evaluation.status,
      isReady: evaluation.isReady,
      attendanceCriterionMet: evaluation.attendanceCriterionMet,
      matchCriterionMet: evaluation.matchCriterionMet,
      readinessReasons: evaluation.reasons,
    };
  }

  /**
   * Helper to compute readiness for a list of active players in batch.
   * Avoids N+1 round trips by fetching closed sessions, attendance, and finalized matches once.
   */
  private static async computeBatchReadiness(
    players: IPlayer[]
  ): Promise<PlayerReadinessDTO[]> {
    if (players.length === 0) return [];

    const playerIds = players.map((p) => p._id);

    // 1. Fetch all closed practice sessions
    const closedSessions = await PracticeSessionModel.find({ status: "closed" })
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .sort({ sessionDate: -1, createdAt: -1 })
      .exec();

    // 2. Fetch all attendance marks for these players
    const allAttendance = await AttendanceModel.find({ playerId: { $in: playerIds } }).exec();
    const attendanceByPlayer = new Map<string, Map<string, IAttendance>>();
    for (const record of allAttendance) {
      const pId = record.playerId.toString();
      if (!attendanceByPlayer.has(pId)) {
        attendanceByPlayer.set(pId, new Map());
      }
      attendanceByPlayer.get(pId)!.set(record.sessionId.toString(), record);
    }

    // 3. Fetch finalized matches and participation
    const finalizedMatches = await MatchModel.find({ status: "finalized" })
      .select("_id matchDate sportId opponentName")
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    const finalizedMatchIds = finalizedMatches.map((m) => m._id);

    const allParticipants = await MatchParticipantModel.find({
      playerId: { $in: playerIds },
      matchId: { $in: finalizedMatchIds },
    }).exec();

    const participantsByPlayer = new Map<string, typeof allParticipants>();
    for (const p of allParticipants) {
      const pId = p.playerId.toString();
      if (!participantsByPlayer.has(pId)) {
        participantsByPlayer.set(pId, []);
      }
      participantsByPlayer.get(pId)!.push(p);
    }

    // 4. Compute metrics for each player
    const results: PlayerReadinessDTO[] = [];

    for (const player of players) {
      const pId = player._id.toString();

      // Attendance computation
      const applicableSessions = closedSessions.filter((session) =>
        AttendanceService.isPlayerEligibleForSession(player, session.sportId._id, session.sessionDate, session)
      );

      const playerAttendanceMap = attendanceByPlayer.get(pId);
      let presentSessions = 0;
      for (const session of applicableSessions) {
        const record = playerAttendanceMap?.get(session._id.toString());
        if (record && record.status === "present") {
          presentSessions++;
        }
      }

      const applicableClosedSessions = applicableSessions.length;
      let numericAttendancePercentage: number | null = null;
      let attendancePercentage = "N/A";

      if (applicableClosedSessions > 0) {
        const computed = (presentSessions / applicableClosedSessions) * 100;
        numericAttendancePercentage = Number(computed.toFixed(1));
        attendancePercentage = `${numericAttendancePercentage.toFixed(1)}%`;
      }

      // Match computation
      const playerParticipations = participantsByPlayer.get(pId) || [];
      const finalizedMatchesPlayed = playerParticipations.length;
      let averageIndividualScore: number | null = null;
      let highestIndividualScore: number | null = null;

      if (finalizedMatchesPlayed > 0) {
        const scores = playerParticipations.map((p) => p.score);
        const sum = scores.reduce((acc, s) => acc + s, 0);
        averageIndividualScore = Number((sum / finalizedMatchesPlayed).toFixed(1));
        highestIndividualScore = Math.max(...scores);
      }

      // Centralized evaluation
      const evaluation = this.evaluateReadiness(
        numericAttendancePercentage,
        finalizedMatchesPlayed
      );

      const sportObj = player.sportId as { _id?: Types.ObjectId; name?: string } | undefined;
      const userObj = player.userId as { email?: string } | undefined;

      results.push({
        playerId: pId,
        fullName: player.fullName,
        email: userObj?.email || "Unknown",
        age: player.age,
        sportId: sportObj?._id ? sportObj._id.toString() : "",
        sportName: sportObj?.name || "Unassigned",
        isActive: player.isActive,
        attendancePercentage,
        numericAttendancePercentage,
        presentSessions,
        applicableClosedSessions,
        finalizedMatchesPlayed,
        averageIndividualScore,
        highestIndividualScore,
        readinessStatus: evaluation.status,
        isReady: evaluation.isReady,
        attendanceCriterionMet: evaluation.attendanceCriterionMet,
        matchCriterionMet: evaluation.matchCriterionMet,
        readinessReasons: evaluation.reasons,
      });
    }

    return results;
  }

  /**
   * Retrieves readiness overview for Coach management.
   * Non-archived players only.
   */
  static async getCoachReadinessList(options: Partial<ReadinessQueryInput> = {}): Promise<{
    players: PlayerReadinessDTO[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    stats: CoachReadinessStats;
    sportsList: Array<{ id: string; name: string }>;
  }> {
    await connectToDatabase();

    const [allActivePlayers, sports] = await Promise.all([
      PlayerModel.find({ isActive: true })
        .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
        .populate<{ userId: { email: string } }>("userId", "email")
        .sort({ fullName: 1 })
        .exec(),
      SportModel.find({ isActive: true }).select("name").sort({ name: 1 }).exec(),
    ]);

    // Compute readiness for all non-archived players
    const allEvaluated = await this.computeBatchReadiness(allActivePlayers as unknown as IPlayer[]);

    // Summary statistics over the active academy roster
    let totalReadyPlayers = 0;
    let totalNotReadyPlayers = 0;
    let meetingAttendanceCriterion = 0;
    let meetingMatchCriterion = 0;

    for (const p of allEvaluated) {
      if (p.isReady) totalReadyPlayers++;
      else totalNotReadyPlayers++;
      if (p.attendanceCriterionMet) meetingAttendanceCriterion++;
      if (p.matchCriterionMet) meetingMatchCriterion++;
    }

    const stats: CoachReadinessStats = {
      totalPlayers: allEvaluated.length,
      totalReadyPlayers,
      totalNotReadyPlayers,
      meetingAttendanceCriterion,
      meetingMatchCriterion,
    };

    // Apply filters
    let filtered = allEvaluated;

    if (options.sportId && options.sportId !== "all") {
      filtered = filtered.filter((p) => p.sportId === options.sportId);
    }

    if (options.status && options.status !== "all") {
      filtered = filtered.filter((p) => p.readinessStatus === options.status);
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    const sortOrder = options.sortOrder === "desc" ? -1 : 1;
    filtered.sort((a, b) => {
      if (options.sortBy === "attendance") {
        const valA = a.numericAttendancePercentage ?? -1;
        const valB = b.numericAttendancePercentage ?? -1;
        if (valA !== valB) return (valA - valB) * sortOrder;
        return a.fullName.localeCompare(b.fullName);
      }
      if (options.sortBy === "matches") {
        if (a.finalizedMatchesPlayed !== b.finalizedMatchesPlayed) {
          return (a.finalizedMatchesPlayed - b.finalizedMatchesPlayed) * sortOrder;
        }
        return a.fullName.localeCompare(b.fullName);
      }
      return a.fullName.localeCompare(b.fullName) * sortOrder;
    });

    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const sportsList = sports.map((s) => ({
      id: s._id.toString(),
      name: s.name,
    }));

    return {
      players: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats,
      sportsList,
    };
  }

  /**
   * Retrieves readiness summary metrics for the Coach overview dashboard.
   */
  static async getCoachReadinessStats(): Promise<CoachReadinessStats> {
    await connectToDatabase();

    const activePlayers = await PlayerModel.find({ isActive: true })
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    const allEvaluated = await this.computeBatchReadiness(activePlayers as unknown as IPlayer[]);

    let totalReadyPlayers = 0;
    let totalNotReadyPlayers = 0;
    let meetingAttendanceCriterion = 0;
    let meetingMatchCriterion = 0;

    for (const p of allEvaluated) {
      if (p.isReady) totalReadyPlayers++;
      else totalNotReadyPlayers++;
      if (p.attendanceCriterionMet) meetingAttendanceCriterion++;
      if (p.matchCriterionMet) meetingMatchCriterion++;
    }

    return {
      totalPlayers: allEvaluated.length,
      totalReadyPlayers,
      totalNotReadyPlayers,
      meetingAttendanceCriterion,
      meetingMatchCriterion,
    };
  }

  /**
   * Scout Discovery: Returns ONLY players who are currently READY.
   * Completely excludes archived and non-ready players.
   * Returns sanitized, data-minimized records.
   */
  static async getScoutReadyPlayers(options: ScoutQueryInput): Promise<{
    players: SafeScoutPlayerDTO[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    totalReadyCount: number;
    availableSports: Array<{ id: string; name: string; count: number }>;
  }> {
    await connectToDatabase();

    // 1. Fetch non-archived active players only
    const activePlayers = await PlayerModel.find({ isActive: true })
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .sort({ fullName: 1 })
      .exec();

    // 2. Compute authoritative readiness
    const allEvaluated = await this.computeBatchReadiness(activePlayers as unknown as IPlayer[]);

    // 3. Filter strictly to READY players
    const readyPlayers = allEvaluated.filter((p) => p.isReady);

    // 4. Derive available sports strictly from sports with at least one READY player
    const sportCounts = new Map<string, { id: string; name: string; count: number }>();
    for (const p of readyPlayers) {
      if (!sportCounts.has(p.sportId)) {
        sportCounts.set(p.sportId, {
          id: p.sportId,
          name: p.sportName,
          count: 0,
        });
      }
      sportCounts.get(p.sportId)!.count++;
    }
    const availableSports = Array.from(sportCounts.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // 5. Apply Scout filters (sport and name search)
    let filtered = readyPlayers;

    if (options.sportId && options.sportId !== "all") {
      filtered = filtered.filter((p) => p.sportId === options.sportId);
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter((p) => p.fullName.toLowerCase().includes(q));
    }

    // 6. Pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    // 7. Sanitize and return safe scout DTOs (Data Minimization)
    const sanitizedPlayers: SafeScoutPlayerDTO[] = paginated.map((p) => ({
      id: p.playerId,
      fullName: p.fullName,
      age: p.age,
      sportId: p.sportId,
      sportName: p.sportName,
      attendancePercentage: p.attendancePercentage,
      numericAttendancePercentage: p.numericAttendancePercentage,
      finalizedMatchesPlayed: p.finalizedMatchesPlayed,
      averageIndividualScore: p.averageIndividualScore,
      highestIndividualScore: p.highestIndividualScore,
      readinessStatus: "ready",
    }));

    return {
      players: sanitizedPlayers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      totalReadyCount: readyPlayers.length,
      availableSports,
    };
  }

  /**
   * Scout Detailed Profile:
   * Returns scouting profile ONLY if the requested player is currently READY.
   * Returns null (404) for nonexistent, archived, or non-ready players.
   * Guarantees that NO Coach remarks or private data are leaked.
   */
  static async getScoutPlayerProfile(playerId: string): Promise<ScoutPlayerProfileDTO | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(playerId)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    // Player must exist and not be archived
    if (!player || !player.isActive) {
      return null;
    }

    // Evaluate readiness using authoritative records
    const readiness = await this.getPlayerReadiness(player._id.toString());
    if (!readiness || !readiness.isReady) {
      return null; // Reject access to non-ready players (404)
    }

    // Fetch match history for finalized matches only
    const participantDocs = await MatchParticipantModel.find({ playerId: player._id })
      .populate<{
        matchId: IMatch & {
          sportId: { _id: Types.ObjectId; name: string };
        };
      }>({
        path: "matchId",
        populate: {
          path: "sportId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    const finalizedParticipations = participantDocs.filter(
      (doc) => doc.matchId && doc.matchId.status === "finalized"
    );

    const history = finalizedParticipations.map((p) => ({
      matchId: p.matchId._id.toString(),
      matchDate: p.matchId.matchDate,
      sportName: p.matchId.sportId?.name || "Unassigned",
      opponentName: p.matchId.opponentName,
      score: p.score,
    }));

    return {
      player: {
        id: player._id.toString(),
        fullName: player.fullName,
        age: player.age,
        sportName: player.sportId?.name || "Unassigned",
        readinessStatus: "ready",
      },
      attendance: {
        attendancePercentage: readiness.attendancePercentage,
        presentSessions: readiness.presentSessions,
        applicableClosedSessions: readiness.applicableClosedSessions,
      },
      matches: {
        totalFinalizedMatches: readiness.finalizedMatchesPlayed,
        averageIndividualScore: readiness.averageIndividualScore,
        highestIndividualScore: readiness.highestIndividualScore,
        history,
      },
    };
  }
}
