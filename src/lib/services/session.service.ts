import { connectToDatabase } from "@/lib/db";
import {
  PracticeSessionModel,
  SportModel,
  AttendanceModel,
  PlayerModel,
  type IPracticeSession,
  type IPlayer,
  type SessionStatus,
} from "@/models";
import { AttendanceService } from "./attendance.service";
import type {
  CreatePracticeSessionInput,
  UpdatePracticeSessionInput,
  SessionQueryInput,
} from "@/lib/validation";
import type { Types } from "mongoose";

export interface SessionListItemDTO {
  id: string;
  sportId: string;
  sportName: string;
  sessionDate: Date;
  status: SessionStatus;
  closedAt?: Date;
  applicableCount: number;
  presentCount: number;
  absentCount: number;
  markedCount: number;
  unmarkedCount: number;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionAttendanceSheetDTO {
  session: {
    id: string;
    sportId: string;
    sportName: string;
    sessionDate: Date;
    status: SessionStatus;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  roster: Array<{
    playerId: string;
    fullName: string;
    email: string;
    status: "present" | "absent" | null;
    markedAt: Date | null;
  }>;
  stats: {
    applicableCount: number;
    presentCount: number;
    absentCount: number;
    markedCount: number;
    unmarkedCount: number;
    isComplete: boolean;
  };
}

export class SessionService {
  /**
   * Normalizes a session date to UTC midnight and provides start and end day bounds.
   * Guarantees consistent date handling without client timezone distortion.
   */
  static normalizeSessionDate(dateInput: string | Date): {
    startOfDay: Date;
    endOfDay: Date;
    normalizedDate: Date;
  } {
    let year: number;
    let month: number;
    let day: number;

    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      const parts = dateInput.trim().split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) {
        throw new Error("Validation Error: Invalid session date provided.");
      }
      year = d.getUTCFullYear();
      month = d.getUTCMonth();
      day = d.getUTCDate();
    }

    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    return { startOfDay, endOfDay, normalizedDate: startOfDay };
  }

  /**
   * Finds a practice session by ID
   */
  static async findById(id: string): Promise<IPracticeSession | null> {
    await connectToDatabase();
    return PracticeSessionModel.findById(id).exec();
  }

  /**
   * Finds practice sessions for a specific sport ordered by session date
   */
  static async findBySport(sportId: string, limit = 50): Promise<IPracticeSession[]> {
    await connectToDatabase();
    return PracticeSessionModel.find({ sportId })
      .sort({ sessionDate: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Creates a new practice session.
   * Validates sport existence and active status.
   * Enforces calendar-date uniqueness per sport to prevent duplicate sessions.
   * Initializes with status: "open".
   */
  static async create(input: CreatePracticeSessionInput): Promise<IPracticeSession> {
    await connectToDatabase();

    const sport = await SportModel.findById(input.sportId).exec();
    if (!sport) {
      throw new Error("Validation Error: Referenced Sport does not exist.");
    }
    if (!sport.isActive) {
      throw new Error("Validation Error: Cannot create practice session for an inactive sport.");
    }

    const { startOfDay, endOfDay, normalizedDate } = this.normalizeSessionDate(input.sessionDate);

    // Prevent duplicate sessions for the same sport and calendar date
    const existing = await PracticeSessionModel.findOne({
      sportId: input.sportId,
      sessionDate: { $gte: startOfDay, $lte: endOfDay },
    }).exec();

    if (existing) {
      throw new Error(
        "Conflict: A practice session already exists for this sport on the selected date."
      );
    }

    const session = new PracticeSessionModel({
      sportId: input.sportId,
      sessionDate: normalizedDate,
      status: "open",
    });

    return session.save();
  }

  /**
   * Retrieves a paginated and filtered list of practice sessions with attendance completion stats.
   */
  static async findSessionsPaginated(query: Partial<SessionQueryInput> = {}): Promise<{
    sessions: SessionListItemDTO[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    await connectToDatabase();
    const { Types } = await import("mongoose");

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.sportId && query.sportId !== "all") {
      if (Types.ObjectId.isValid(query.sportId)) {
        filter.sportId = new Types.ObjectId(query.sportId);
      }
    }

    if (query.status && (query.status === "open" || query.status === "closed")) {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        const { startOfDay } = this.normalizeSessionDate(query.startDate);
        dateFilter.$gte = startOfDay;
      }
      if (query.endDate) {
        const { endOfDay } = this.normalizeSessionDate(query.endDate);
        dateFilter.$lte = endOfDay;
      }
      filter.sessionDate = dateFilter;
    }

    const total = await PracticeSessionModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(total / limit) || 1;

    const sessionDocs = await PracticeSessionModel.find(filter)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .sort({ sessionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Compute attendance statistics for each session
    const sessions: SessionListItemDTO[] = await Promise.all(
      sessionDocs.map(async (doc) => {
        const [eligiblePlayers, attendanceRecords] = await Promise.all([
          AttendanceService.getEligiblePlayersForSession(doc),
          AttendanceModel.find({ sessionId: doc._id }).exec(),
        ]);

        const applicableCount = eligiblePlayers.length;
        let presentCount = 0;
        let absentCount = 0;

        for (const record of attendanceRecords) {
          if (record.status === "present") presentCount++;
          if (record.status === "absent") absentCount++;
        }

        const markedCount = presentCount + absentCount;
        const unmarkedCount = Math.max(0, applicableCount - markedCount);
        const isComplete = applicableCount > 0 && markedCount >= applicableCount;

        return {
          id: doc._id.toString(),
          sportId: doc.sportId ? doc.sportId._id.toString() : "",
          sportName: doc.sportId?.name || "Unassigned",
          sessionDate: doc.sessionDate,
          status: doc.status,
          closedAt: doc.closedAt,
          applicableCount,
          presentCount,
          absentCount,
          markedCount,
          unmarkedCount,
          isComplete,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      })
    );

    return {
      sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves the complete attendance sheet for a session.
   * Returns session metadata, applicable player roster with current marks, and completion stats.
   */
  static async getAttendanceSheet(id: string): Promise<SessionAttendanceSheetDTO | null> {
    await connectToDatabase();

    const session = await PracticeSessionModel.findById(id)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    if (!session) {
      return null;
    }

    // Backend determines applicable roster
    const eligiblePlayers = await AttendanceService.getEligiblePlayersForSession(session);

    // Fetch existing attendance records
    const attendanceRecords = await AttendanceModel.find({ sessionId: session._id }).exec();

    // For closed sessions, ensure all players with recorded attendance remain on historical sheet
    if (session.status === "closed") {
      const eligibleIds = new Set(eligiblePlayers.map((p) => p._id.toString()));
      const missingRecordedIds = attendanceRecords
        .map((r) => r.playerId.toString())
        .filter((pId) => !eligibleIds.has(pId));

      if (missingRecordedIds.length > 0) {
        const historicalPlayers = await PlayerModel.find({ _id: { $in: missingRecordedIds } })
          .populate<{ userId: { _id: Types.ObjectId; email: string; isActive: boolean } }>(
            "userId",
            "email isActive"
          )
          .exec();
        eligiblePlayers.push(...(historicalPlayers as unknown as IPlayer[]));
      }
    }

    const attendanceMap = new Map<string, { status: "present" | "absent"; markedAt: Date }>();
    for (const record of attendanceRecords) {
      attendanceMap.set(record.playerId.toString(), {
        status: record.status,
        markedAt: record.markedAt,
      });
    }

    let presentCount = 0;
    let absentCount = 0;

    const roster = eligiblePlayers.map((player) => {
      const email = (player.userId as { email?: string })?.email || "Unknown";
      const record = attendanceMap.get(player._id.toString());

      if (record) {
        if (record.status === "present") presentCount++;
        if (record.status === "absent") absentCount++;
      }

      return {
        playerId: player._id.toString(),
        fullName: player.fullName,
        email,
        status: record ? record.status : null,
        markedAt: record ? record.markedAt : null,
      };
    });

    const applicableCount = eligiblePlayers.length;
    const markedCount = presentCount + absentCount;
    const unmarkedCount = Math.max(0, applicableCount - markedCount);
    const isComplete = applicableCount > 0 && markedCount >= applicableCount;

    return {
      session: {
        id: session._id.toString(),
        sportId: session.sportId ? session.sportId._id.toString() : "",
        sportName: session.sportId?.name || "Unassigned",
        sessionDate: session.sessionDate,
        status: session.status,
        closedAt: session.closedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      roster,
      stats: {
        applicableCount,
        presentCount,
        absentCount,
        markedCount,
        unmarkedCount,
        isComplete,
      },
    };
  }

  /**
   * Finalizes and closes a practice session.
   * Enforces backend validation: A session cannot be closed until every applicable player
   * has an explicit Present or Absent record.
   * Sets status: "closed" and records closedAt timestamp.
   * Closed sessions are completely immutable.
   */
  static async closeSession(id: string): Promise<IPracticeSession | null> {
    await connectToDatabase();

    const session = await PracticeSessionModel.findById(id).exec();
    if (!session) {
      return null;
    }

    if (session.status === "closed") {
      throw new Error("Validation Error: Practice session is already closed and immutable.");
    }

    // Determine applicable players from backend
    const eligiblePlayers = await AttendanceService.getEligiblePlayersForSession(session);

    if (eligiblePlayers.length === 0) {
      throw new Error("Cannot close session: No eligible players found for this sport.");
    }

    // Fetch existing attendance records
    const attendanceRecords = await AttendanceModel.find({ sessionId: session._id }).exec();
    const markedPlayerIds = new Set(
      attendanceRecords
        .filter((r) => r.status === "present" || r.status === "absent")
        .map((r) => r.playerId.toString())
    );

    const unmarkedPlayers = eligiblePlayers.filter((p) => !markedPlayerIds.has(p._id.toString()));

    if (unmarkedPlayers.length > 0) {
      throw new Error(
        `Cannot close session: ${unmarkedPlayers.length} applicable player(s) are still unmarked. All applicable players must have an explicit Present or Absent status before closure.`
      );
    }

    // Concurrency safe: atomically update only if session is currently "open"
    const closed = await PracticeSessionModel.findOneAndUpdate(
      { _id: id, status: "open" },
      { $set: { status: "closed", closedAt: new Date() } },
      { returnDocument: "after" }
    ).exec();

    if (!closed) {
      throw new Error("Validation Error: Session could not be closed or is already closed.");
    }

    return closed;
  }

  /**
   * Updates an open practice session. Prevents modification of closed sessions and rejects reopening.
   */
  static async update(
    id: string,
    input: UpdatePracticeSessionInput
  ): Promise<IPracticeSession | null> {
    await connectToDatabase();

    const session = await PracticeSessionModel.findById(id).exec();
    if (!session) {
      return null;
    }

    if (session.status === "closed") {
      throw new Error(
        "Validation Error: Closed practice sessions are immutable and cannot be updated."
      );
    }

    if (input.status === "closed") {
      // Delegate to closeSession so that full attendance completeness is strictly enforced
      return this.closeSession(id);
    }

    if (input.sessionDate) {
      const { normalizedDate } = this.normalizeSessionDate(input.sessionDate);
      session.sessionDate = normalizedDate;
    }

    return session.save();
  }
}
