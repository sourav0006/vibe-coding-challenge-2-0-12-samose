import { connectToDatabase } from "@/lib/db";
import {
  AttendanceModel,
  PlayerModel,
  PracticeSessionModel,
  type IAttendance,
  type IPlayer,
  type AttendanceStatus,
  type SessionStatus,
} from "@/models";
import type { MarkAttendanceInput, UpdateAttendanceInput } from "@/lib/validation";
import type { Types } from "mongoose";

export interface PlayerAttendanceRecordDTO {
  sessionId: string;
  sessionDate: Date;
  sportName: string;
  status: AttendanceStatus;
  markedAt: Date;
}

export interface PlayerAttendanceStatsResult {
  player: {
    id: string;
    fullName: string;
    sportId: string;
    sportName: string;
    isActive: boolean;
  };
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: string; // "75.0%" or "N/A"
  percentageValue: number | null; // 75.0 or null
  history: PlayerAttendanceRecordDTO[];
}

export class AttendanceService {
  /**
   * Evaluates whether a player was eligible for a practice session on its scheduled date.
   * Uses sportHistory with effectiveFrom and effectiveTo date ranges.
   * When sessionContext indicates a closed session, enforces that players registered after
   * the session was finalized (closedAt) are excluded from the roster and historical denominator.
   * Provides a safe, conservative fallback for legacy player records without history.
   */
  static isPlayerEligibleForSession(
    player: {
      sportId: Types.ObjectId | string | { _id: Types.ObjectId | string };
      sportHistory?: Array<{ sportId: Types.ObjectId; effectiveFrom: Date; effectiveTo?: Date | null }>;
      createdAt?: Date;
    },
    sportId: string | Types.ObjectId,
    sessionDate: Date,
    sessionContext?: {
      status?: SessionStatus | string;
      closedAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ): boolean {
    const targetSportId = sportId.toString();

    // Determine calendar boundaries for the session date in UTC
    const dateObj = new Date(sessionDate);
    const sessionYear = dateObj.getUTCFullYear();
    const sessionMonth = dateObj.getUTCMonth();
    const sessionDay = dateObj.getUTCDate();

    const sessionStart = new Date(Date.UTC(sessionYear, sessionMonth, sessionDay, 0, 0, 0, 0));
    const sessionEnd = new Date(Date.UTC(sessionYear, sessionMonth, sessionDay, 23, 59, 59, 999));

    // When a session has been finalized and closed, its cutoff timestamp is closedAt (or updatedAt).
    // A player registered after the session was closed was not part of the academy during that session.
    const isClosed = sessionContext?.status === "closed" || Boolean(sessionContext?.closedAt);
    const sessionCutoff = isClosed && sessionContext?.closedAt
      ? new Date(sessionContext.closedAt)
      : isClosed && sessionContext?.updatedAt
      ? new Date(sessionContext.updatedAt)
      : sessionEnd;

    // If sport history is recorded on the player profile, check history entries
    if (player.sportHistory && player.sportHistory.length > 0) {
      return player.sportHistory.some((entry) => {
        if (entry.sportId.toString() !== targetSportId) {
          return false;
        }

        const effectiveFrom = new Date(entry.effectiveFrom);
        if (effectiveFrom > sessionCutoff) {
          return false;
        }

        if (entry.effectiveTo) {
          const effectiveTo = new Date(entry.effectiveTo);
          if (effectiveTo < sessionStart) {
            return false;
          }
        }

        return true;
      });
    }

    // Conservative fallback for legacy player records created before sportHistory:
    // Player is eligible if assigned to the session's sport and player profile existed by session date
    const playerSportId =
      typeof player.sportId === "object" && player.sportId !== null && "_id" in player.sportId
        ? (player.sportId as { _id: Types.ObjectId | string })._id.toString()
        : player.sportId.toString();

    if (playerSportId !== targetSportId) {
      return false;
    }

    if (player.createdAt) {
      const createdDate = new Date(player.createdAt);
      if (createdDate > sessionCutoff) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieves all non-archived players eligible for a specific practice session.
   * Includes pending and active players; excludes archived players.
   */
  static async getEligiblePlayersForSession(session: {
    sportId: Types.ObjectId | string | { _id: Types.ObjectId | string };
    sessionDate: Date;
    status?: SessionStatus | string;
    closedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<IPlayer[]> {
    await connectToDatabase();

    const targetSportId =
      typeof session.sportId === "object" && session.sportId !== null && "_id" in session.sportId
        ? (session.sportId as { _id: Types.ObjectId | string })._id.toString()
        : session.sportId.toString();

    // Fetch all non-archived players (isActive: true)
    const activePlayers = await PlayerModel.find({ isActive: true })
      .populate<{ userId: { _id: Types.ObjectId; email: string; isActive: boolean } }>(
        "userId",
        "email isActive"
      )
      .sort({ fullName: 1 })
      .exec();

    return (activePlayers as unknown as IPlayer[]).filter((player) =>
      this.isPlayerEligibleForSession(player, targetSportId, session.sessionDate, session)
    );
  }

  /**
   * Records or updates attendance for a single player in a session.
   * Validates session open status, player eligibility, and performs an atomic upsert.
   */
  static async markAttendance(input: MarkAttendanceInput): Promise<IAttendance> {
    await connectToDatabase();

    const [session, player] = await Promise.all([
      PracticeSessionModel.findById(input.sessionId).exec(),
      PlayerModel.findById(input.playerId).exec(),
    ]);

    if (!session) {
      throw new Error("Validation Error: Referenced PracticeSession does not exist.");
    }
    if (session.status === "closed") {
      throw new Error("Validation Error: Cannot record or modify attendance for a closed session.");
    }

    if (!player) {
      throw new Error("Validation Error: Referenced Player does not exist.");
    }

    if (!player.isActive) {
      throw new Error("Validation Error: Cannot mark attendance for an archived player.");
    }

    const isEligible = this.isPlayerEligibleForSession(player, session.sportId, session.sessionDate);
    if (!isEligible) {
      throw new Error("Validation Error: Player is not eligible for this practice session.");
    }

    return AttendanceModel.findOneAndUpdate(
      { sessionId: input.sessionId, playerId: input.playerId },
      {
        $set: {
          status: input.status,
          markedAt: input.markedAt || new Date(),
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IAttendance>;
  }

  /**
   * Records or updates attendance in bulk for a practice session.
   * Validates that the session is open, that all players are eligible, and performs atomic upserts.
   */
  static async recordSessionAttendance(
    sessionId: string,
    records: Array<{ playerId: string; status: AttendanceStatus }>
  ): Promise<{ updatedCount: number }> {
    await connectToDatabase();

    const session = await PracticeSessionModel.findById(sessionId).exec();
    if (!session) {
      throw new Error("Validation Error: Referenced PracticeSession does not exist.");
    }
    if (session.status === "closed") {
      throw new Error("Validation Error: Cannot record or modify attendance for a closed session.");
    }

    // Retrieve eligible roster from backend
    const eligiblePlayers = await this.getEligiblePlayersForSession(session);
    const eligibleIdSet = new Set(eligiblePlayers.map((p) => p._id.toString()));

    for (const record of records) {
      if (!eligibleIdSet.has(record.playerId)) {
        throw new Error(
          `Validation Error: Player ${record.playerId} is not eligible for this practice session.`
        );
      }
    }

    const now = new Date();
    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: { sessionId: session._id, playerId: record.playerId },
        update: {
          $set: {
            status: record.status,
            markedAt: now,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await AttendanceModel.bulkWrite(bulkOps);
    }

    // Ensure session was not closed concurrently
    const refreshed = await PracticeSessionModel.findById(sessionId).select("status").exec();
    if (refreshed?.status === "closed") {
      throw new Error("Validation Error: Session was closed during attendance update.");
    }

    return { updatedCount: records.length };
  }

  /**
   * Retrieves all attendance records for a specific session
   */
  static async findBySession(sessionId: string): Promise<IAttendance[]> {
    await connectToDatabase();
    return AttendanceModel.find({ sessionId }).exec();
  }

  /**
   * Retrieves all attendance records for a player
   */
  static async findByPlayer(playerId: string, limit = 100): Promise<IAttendance[]> {
    await connectToDatabase();
    return AttendanceModel.find({ playerId })
      .sort({ markedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Updates an existing attendance record directly (ensuring parent session is open)
   */
  static async update(id: string, input: UpdateAttendanceInput): Promise<IAttendance | null> {
    await connectToDatabase();

    const existing = await AttendanceModel.findById(id).exec();
    if (!existing) {
      return null;
    }

    const session = await PracticeSessionModel.findById(existing.sessionId).exec();
    if (!session || session.status === "closed") {
      throw new Error("Validation Error: Cannot modify attendance for a closed session.");
    }

    return AttendanceModel.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).exec();
  }

  /**
   * Computes accurate historical attendance statistics for an individual player.
   *
   * Formula:
   * Attendance Percentage = (Present Sessions / Applicable Closed Sessions) * 100
   *
   * Strict Rules:
   * 1. Only closed sessions count in the denominator.
   * 2. Only sessions belonging to the player's assigned sport count.
   * 3. Only sessions conducted while the player was eligible for that sport count.
   * 4. Present records count toward the numerator.
   * 5. Absent records count in the denominator but not the numerator.
   * 6. Open sessions do not affect the percentage.
   * 7. Sessions belonging to other sports do not affect the percentage.
   * 8. Archived players retain their historical attendance data.
   * 9. If there are no applicable closed sessions, display "N/A".
   * 10. Display with consistent rounding: 1 decimal place (e.g., 75.0%).
   */
  static async getPlayerAttendanceStats(playerId: string): Promise<PlayerAttendanceStatsResult | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(playerId)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    if (!player) {
      return null;
    }

    // 1. Fetch all closed sessions with their sport populated
    const closedSessions = await PracticeSessionModel.find({ status: "closed" })
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .sort({ sessionDate: -1, createdAt: -1 })
      .exec();

    // 2. Filter to applicable closed sessions where player was eligible on that session's date
    const applicableClosedSessions = closedSessions.filter((session) =>
      this.isPlayerEligibleForSession(player, session.sportId._id, session.sessionDate, session)
    );

    // 3. Fetch all attendance records for this player
    const attendanceRecords = await AttendanceModel.find({ playerId: player._id }).exec();
    const attendanceBySession = new Map<string, IAttendance>();
    for (const record of attendanceRecords) {
      attendanceBySession.set(record.sessionId.toString(), record);
    }

    // 4. Calculate numerator and denominator
    let presentCount = 0;
    let absentCount = 0;
    const history: PlayerAttendanceRecordDTO[] = [];

    for (const session of applicableClosedSessions) {
      const record = attendanceBySession.get(session._id.toString());
      const sportName = session.sportId?.name || "Unassigned";

      if (record && record.status === "present") {
        presentCount++;
        history.push({
          sessionId: session._id.toString(),
          sessionDate: session.sessionDate,
          sportName,
          status: "present",
          markedAt: record.markedAt,
        });
      } else {
        // Record is absent or unrecorded in closed session
        absentCount++;
        history.push({
          sessionId: session._id.toString(),
          sessionDate: session.sessionDate,
          sportName,
          status: "absent",
          markedAt: record ? record.markedAt : session.closedAt || session.updatedAt,
        });
      }
    }

    const totalSessions = applicableClosedSessions.length;

    let attendancePercentage: string;
    let percentageValue: number | null;

    if (totalSessions === 0) {
      attendancePercentage = "N/A";
      percentageValue = null;
    } else {
      const computed = (presentCount / totalSessions) * 100;
      percentageValue = Number(computed.toFixed(1));
      attendancePercentage = `${percentageValue.toFixed(1)}%`;
    }

    return {
      player: {
        id: player._id.toString(),
        fullName: player.fullName,
        sportId: player.sportId ? player.sportId._id.toString() : "",
        sportName: player.sportId?.name || "Unassigned",
        isActive: player.isActive,
      },
      totalSessions,
      presentCount,
      absentCount,
      attendancePercentage,
      percentageValue,
      history,
    };
  }
}
