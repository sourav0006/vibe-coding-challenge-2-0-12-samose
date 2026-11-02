import { connectToDatabase } from "@/lib/db";
import {
  MatchModel,
  MatchParticipantModel,
  PlayerModel,
  SportModel,
  PracticeSessionModel,
  AttendanceModel,
  type IMatch,
  type IMatchParticipant,
  type MatchStatus,
  type IPlayer,
} from "@/models";
import { AttendanceService } from "./attendance.service";
import type {
  CreateMatchInput,
  UpdateMatchInput,
  MatchQueryInput,
} from "@/lib/validation";
import type { Types } from "mongoose";

export interface MatchListItemDTO {
  id: string;
  sportId: string;
  sportName: string;
  matchDate: Date;
  opponentName: string;
  status: MatchStatus;
  finalizedAt?: Date;
  participantCount: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchParticipantDTO {
  id: string;
  playerId: string;
  fullName: string;
  email: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EligibleMatchPlayerDTO {
  playerId: string;
  fullName: string;
  email: string;
  sameDayAttendance: "present" | "absent" | "unmarked" | "none";
  isEligibleForMatch: boolean;
  ineligibilityReason?: string;
}

export interface MatchDetailDTO {
  match: {
    id: string;
    sportId: string;
    sportName: string;
    matchDate: Date;
    opponentName: string;
    status: MatchStatus;
    finalizedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  stats: {
    totalParticipants: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
  participants: MatchParticipantDTO[];
  eligibleRoster: EligibleMatchPlayerDTO[];
  sameDaySession: {
    id: string;
    status: "open" | "closed";
  } | null;
}

export type MatchDetailsDTO = MatchDetailDTO;

export interface PlayerMatchHistoryDTO {
  player: {
    id: string;
    fullName: string;
    sportId: string;
    sportName: string;
  };
  totalMatches: number;
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
  matchHistory: Array<{
    matchId: string;
    matchDate: Date;
    sportName: string;
    opponentName: string;
    score: number;
  }>;
}

export type PlayerMatchStatsResult = PlayerMatchHistoryDTO;


export class MatchService {
  /**
   * Normalizes a match date to UTC midnight and provides start/end calendar day bounds.
   */
  static normalizeMatchDate(dateInput: string | Date): {
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
        throw new Error("Validation Error: Invalid match date provided.");
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
   * Finds a match by ID
   */
  static async findMatchById(id: string): Promise<IMatch | null> {
    await connectToDatabase();
    return MatchModel.findById(id).exec();
  }

  /**
   * Creates a new match fixture in "draft" status.
   * Validates referenced sport existence and active status.
   * Prevents accidental duplicate match creation for the same sport, date, and opponent.
   */
  static async createMatch(input: CreateMatchInput): Promise<IMatch> {
    await connectToDatabase();

    const sport = await SportModel.findById(input.sportId).exec();
    if (!sport) {
      throw new Error("Validation Error: Referenced Sport does not exist.");
    }
    if (!sport.isActive) {
      throw new Error("Validation Error: Cannot schedule a match fixture for an inactive sport.");
    }

    const trimmedOpponent = input.opponentName.trim();
    if (!trimmedOpponent) {
      throw new Error("Validation Error: Opponent name cannot be empty.");
    }

    const { startOfDay, endOfDay, normalizedDate } = this.normalizeMatchDate(input.matchDate);

    // Prevent duplicate matches for the same sport, calendar date, and opponent name
    const existing = await MatchModel.findOne({
      sportId: input.sportId,
      matchDate: { $gte: startOfDay, $lte: endOfDay },
      opponentName: new RegExp(`^${trimmedOpponent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).exec();

    if (existing) {
      throw new Error(
        `Conflict: A match fixture already exists for ${sport.name} against "${trimmedOpponent}" on the selected date.`
      );
    }

    const match = new MatchModel({
      sportId: input.sportId,
      matchDate: normalizedDate,
      opponentName: trimmedOpponent,
      status: "draft",
    });

    return match.save();
  }

  /**
   * Evaluates player eligibility and same-day attendance constraints for a match.
   */
  static async getEligibleRosterForMatch(match: {
    _id?: Types.ObjectId | string;
    sportId: Types.ObjectId | string | { _id: Types.ObjectId | string };
    matchDate: Date;
  }): Promise<{
    sameDaySession: { id: string; status: "open" | "closed" } | null;
    roster: EligibleMatchPlayerDTO[];
  }> {
    await connectToDatabase();

    const targetSportId =
      typeof match.sportId === "object" && match.sportId !== null && "_id" in match.sportId
        ? (match.sportId as { _id: Types.ObjectId | string })._id.toString()
        : match.sportId.toString();

    // 1. Fetch non-archived players assigned to this sport on match date
    const activePlayers = await PlayerModel.find({ isActive: true })
      .populate<{ userId: { _id: Types.ObjectId; email: string; isActive: boolean } }>(
        "userId",
        "email isActive"
      )
      .sort({ fullName: 1 })
      .exec();

    const sportEligiblePlayers = (activePlayers as unknown as IPlayer[]).filter((player) =>
      AttendanceService.isPlayerEligibleForSession(player, targetSportId, match.matchDate)
    );

    // 2. Check for a practice session on the same sport and calendar date
    const { startOfDay, endOfDay } = this.normalizeMatchDate(match.matchDate);
    const sameDaySession = await PracticeSessionModel.findOne({
      sportId: targetSportId,
      sessionDate: { $gte: startOfDay, $lte: endOfDay },
    }).exec();

    let sameDaySessionInfo: { id: string; status: "open" | "closed" } | null = null;
    const attendanceMap = new Map<string, "present" | "absent">();

    if (sameDaySession) {
      sameDaySessionInfo = {
        id: sameDaySession._id.toString(),
        status: sameDaySession.status,
      };

      const attendanceRecords = await AttendanceModel.find({ sessionId: sameDaySession._id }).exec();
      for (const rec of attendanceRecords) {
        attendanceMap.set(rec.playerId.toString(), rec.status);
      }
    }

    // 3. Build annotated eligible roster applying same-day attendance rules
    const roster: EligibleMatchPlayerDTO[] = sportEligiblePlayers.map((player) => {
      const pId = player._id.toString();
      const email = (player.userId as { email?: string })?.email || "Unknown";

      if (!sameDaySession) {
        // No same-day session: sport-history eligibility applies normally
        return {
          playerId: pId,
          fullName: player.fullName,
          email,
          sameDayAttendance: "none",
          isEligibleForMatch: true,
        };
      }

      // Same-day practice session exists
      const attStatus = attendanceMap.get(pId);
      if (attStatus === "present") {
        return {
          playerId: pId,
          fullName: player.fullName,
          email,
          sameDayAttendance: "present",
          isEligibleForMatch: true,
        };
      } else if (attStatus === "absent") {
        return {
          playerId: pId,
          fullName: player.fullName,
          email,
          sameDayAttendance: "absent",
          isEligibleForMatch: false,
          ineligibilityReason: "Marked Absent in same-day practice session.",
        };
      } else {
        return {
          playerId: pId,
          fullName: player.fullName,
          email,
          sameDayAttendance: "unmarked",
          isEligibleForMatch: false,
          ineligibilityReason: "No attendance recorded in same-day practice session.",
        };
      }
    });

    return {
      sameDaySession: sameDaySessionInfo,
      roster,
    };
  }

  /**
   * Retrieves a paginated and filtered list of matches with calculated score statistics.
   */
  static async findMatchesPaginated(query: Partial<MatchQueryInput> = {}): Promise<{
    matches: MatchListItemDTO[];
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

    if (query.status && (query.status === "draft" || query.status === "finalized")) {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        const { startOfDay } = this.normalizeMatchDate(query.startDate);
        dateFilter.$gte = startOfDay;
      }
      if (query.endDate) {
        const { endOfDay } = this.normalizeMatchDate(query.endDate);
        dateFilter.$lte = endOfDay;
      }
      filter.matchDate = dateFilter;
    }

    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.opponentName = new RegExp(sanitized, "i");
    }

    const total = await MatchModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(total / limit) || 1;

    const matchDocs = await MatchModel.find(filter)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .sort({ matchDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Fetch participant statistics for each match
    const matches: MatchListItemDTO[] = await Promise.all(
      matchDocs.map(async (doc) => {
        const participants = await MatchParticipantModel.find({ matchId: doc._id }).select("score").exec();
        const participantCount = participants.length;

        let averageScore: number | null = null;
        let highestScore: number | null = null;
        let lowestScore: number | null = null;

        if (participantCount > 0) {
          const scores = participants.map((p) => p.score);
          const sum = scores.reduce((acc, s) => acc + s, 0);
          averageScore = Number((sum / participantCount).toFixed(1));
          highestScore = Math.max(...scores);
          lowestScore = Math.min(...scores);
        }

        return {
          id: doc._id.toString(),
          sportId: doc.sportId ? doc.sportId._id.toString() : "",
          sportName: doc.sportId?.name || "Unassigned",
          matchDate: doc.matchDate,
          opponentName: doc.opponentName,
          status: doc.status || "draft",
          finalizedAt: doc.finalizedAt,
          participantCount,
          averageScore,
          highestScore,
          lowestScore,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      })
    );

    return {
      matches,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves full match details, current participants and scores, score summary statistics,
   * and the eligible roster with same-day attendance statuses.
   */
  static async getMatchDetails(id: string): Promise<MatchDetailDTO | null> {
    await connectToDatabase();

    const match = await MatchModel.findById(id)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    if (!match) {
      return null;
    }

    // 1. Fetch current participating players and scores
    const participantDocs = await MatchParticipantModel.find({ matchId: match._id })
      .populate<{
        playerId: {
          _id: Types.ObjectId;
          fullName: string;
          userId: { _id: Types.ObjectId; email: string };
        };
      }>({
        path: "playerId",
        select: "fullName userId",
        populate: {
          path: "userId",
          select: "email",
        },
      })
      .sort({ createdAt: 1 })
      .exec();

    const participants: MatchParticipantDTO[] = participantDocs.map((p) => {
      const playerObj = p.playerId as unknown as {
        _id: Types.ObjectId;
        fullName: string;
        userId?: { email?: string };
      };

      return {
        id: p._id.toString(),
        playerId: playerObj ? playerObj._id.toString() : p.playerId.toString(),
        fullName: playerObj?.fullName || "Unknown Player",
        email: playerObj?.userId?.email || "Unknown",
        score: p.score,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    // 2. Compute aggregate score metrics
    const participantCount = participants.length;
    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;

    if (participantCount > 0) {
      const scores = participants.map((p) => p.score);
      const sum = scores.reduce((acc, s) => acc + s, 0);
      averageScore = Number((sum / participantCount).toFixed(1));
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    // 3. Retrieve eligible roster with same-day attendance enforcement
    const { sameDaySession, roster } = await this.getEligibleRosterForMatch(match);

    return {
      match: {
        id: match._id.toString(),
        sportId: match.sportId ? match.sportId._id.toString() : "",
        sportName: match.sportId?.name || "Unassigned",
        matchDate: match.matchDate,
        opponentName: match.opponentName,
        status: match.status || "draft",
        finalizedAt: match.finalizedAt,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      },
      stats: {
        totalParticipants: participantCount,
        averageScore,
        highestScore,
        lowestScore,
      },
      participants,
      eligibleRoster: roster,
      sameDaySession,
    };
  }

  /**
   * Adds or updates an individual player's participation and performance score.
   * Validates match draft status, score bounds (0-10), and player eligibility.
   */
  static async addOrUpdateParticipant(
    matchId: string,
    playerId: string,
    score: number
  ): Promise<IMatchParticipant> {
    await connectToDatabase();

    const match = await MatchModel.findById(matchId).exec();
    if (!match) {
      throw new Error("Validation Error: Referenced Match does not exist.");
    }
    if (match.status === "finalized") {
      throw new Error(
        "Validation Error: Cannot add or modify participants for a finalized match. Finalized matches are immutable."
      );
    }

    if (typeof score !== "number" || isNaN(score) || score < 0 || score > 10) {
      throw new Error("Validation Error: Individual match score must be a number between 0 and 10.");
    }

    // Verify player eligibility including same-day attendance rules
    const { roster } = await this.getEligibleRosterForMatch(match);
    const eligibleEntry = roster.find((r) => r.playerId === playerId);

    if (!eligibleEntry) {
      throw new Error(
        "Validation Error: Player is not assigned to this sport or was not active on the match date."
      );
    }

    if (!eligibleEntry.isEligibleForMatch) {
      throw new Error(
        `Validation Error: Player is ineligible for this match. ${eligibleEntry.ineligibilityReason || ""}`
      );
    }

    // Atomic upsert enforcing unique compound index (matchId + playerId)
    return MatchParticipantModel.findOneAndUpdate(
      { matchId: match._id, playerId },
      { $set: { score } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IMatchParticipant>;
  }

  /**
   * Removes a participating player from a match fixture.
   * Only permitted while the match is in draft status.
   */
  static async removeParticipant(matchId: string, playerId: string): Promise<boolean> {
    await connectToDatabase();

    const match = await MatchModel.findById(matchId).exec();
    if (!match) {
      throw new Error("Validation Error: Referenced Match does not exist.");
    }
    if (match.status === "finalized") {
      throw new Error(
        "Validation Error: Cannot remove participants from a finalized match. Finalized matches are immutable."
      );
    }

    const result = await MatchParticipantModel.findOneAndDelete({ matchId, playerId }).exec();
    return Boolean(result);
  }

  /**
   * Batch updates or sets scores for participants in a draft match.
   */
  static async saveParticipantsBatch(
    matchId: string,
    participants: Array<{ playerId: string; score: number }>
  ): Promise<{ updatedCount: number }> {
    await connectToDatabase();

    const match = await MatchModel.findById(matchId).exec();
    if (!match) {
      throw new Error("Validation Error: Referenced Match does not exist.");
    }
    if (match.status === "finalized") {
      throw new Error(
        "Validation Error: Cannot modify participants for a finalized match. Finalized matches are immutable."
      );
    }

    const { roster } = await this.getEligibleRosterForMatch(match);
    const eligibleMap = new Map(roster.filter((r) => r.isEligibleForMatch).map((r) => [r.playerId, r]));

    for (const p of participants) {
      if (typeof p.score !== "number" || isNaN(p.score) || p.score < 0 || p.score > 10) {
        throw new Error(
          `Validation Error: Invalid score ${p.score}. Scores must be between 0 and 10.`
        );
      }
      if (!eligibleMap.has(p.playerId)) {
        const found = roster.find((r) => r.playerId === p.playerId);
        throw new Error(
          `Validation Error: Player ${p.playerId} is ineligible for this match. ${found?.ineligibilityReason || ""}`
        );
      }
    }

    const bulkOps = participants.map((p) => ({
      updateOne: {
        filter: { matchId: match._id, playerId: p.playerId },
        update: { $set: { score: p.score } },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await MatchParticipantModel.bulkWrite(bulkOps);
    }

    return { updatedCount: participants.length };
  }

  /**
   * Finalizes a match fixture.
   * Rules:
   * 1. Match must be in draft status.
   * 2. At least one participating player must exist with a valid score.
   * 3. Every participant must have a valid score between 0 and 10.
   * 4. Same-day practice session rule:
   *    - If a same-day practice session exists and remains open, match CANNOT be finalized.
   *    - If a same-day session is closed, every participant MUST have been marked Present.
   * 5. Atomically transitions to status: "finalized" with finalizedAt timestamp.
   * 6. Finalized matches are permanently immutable.
   */
  static async finalizeMatch(id: string): Promise<IMatch | null> {
    await connectToDatabase();

    const match = await MatchModel.findById(id).exec();
    if (!match) {
      return null;
    }

    if (match.status === "finalized") {
      throw new Error("Validation Error: Match is already finalized and immutable.");
    }

    // 1. Verify at least one participant exists
    const participants = await MatchParticipantModel.find({ matchId: match._id }).exec();
    if (participants.length === 0) {
      throw new Error(
        "Cannot finalize match: At least one participating player must be selected with an individual score before finalization."
      );
    }

    // 2. Validate all scores
    for (const p of participants) {
      if (typeof p.score !== "number" || isNaN(p.score) || p.score < 0 || p.score > 10) {
        throw new Error(
          `Cannot finalize match: Participant ${p.playerId.toString()} has an invalid score (${p.score}). All scores must be between 0 and 10.`
        );
      }
    }

    // 3. Enforce same-day practice session constraints
    const { sameDaySession, roster } = await this.getEligibleRosterForMatch(match);

    if (sameDaySession && sameDaySession.status === "open") {
      throw new Error(
        "Cannot finalize match: A practice session exists on the match date that has not been closed. Please finalize and close the practice session before finalizing this match."
      );
    }

    const eligibleMap = new Map(roster.filter((r) => r.isEligibleForMatch).map((r) => [r.playerId, r]));

    for (const p of participants) {
      const eligibleEntry = eligibleMap.get(p.playerId.toString());
      if (!eligibleEntry) {
        const found = roster.find((r) => r.playerId === p.playerId.toString());
        throw new Error(
          `Cannot finalize match: Participant ${p.playerId.toString()} does not meet match eligibility. ${found?.ineligibilityReason || ""}`
        );
      }
    }

    // 4. Atomically finalize match
    const finalized = await MatchModel.findOneAndUpdate(
      { _id: id, status: "draft" },
      { $set: { status: "finalized", finalizedAt: new Date() } },
      { returnDocument: "after" }
    ).exec();

    if (!finalized) {
      throw new Error("Validation Error: Match could not be finalized or was already modified.");
    }

    return finalized;
  }

  /**
   * Updates an existing match fixture details while in draft status.
   * Rejects any modifications if the match is already finalized.
   */
  static async updateMatch(id: string, input: UpdateMatchInput): Promise<IMatch | null> {
    await connectToDatabase();

    const match = await MatchModel.findById(id).exec();
    if (!match) {
      return null;
    }

    if (match.status === "finalized") {
      throw new Error(
        "Validation Error: Finalized matches are immutable and cannot be updated."
      );
    }

    if (input.status === "finalized") {
      // Delegate to finalizeMatch to enforce all finalization invariants
      return this.finalizeMatch(id);
    }

    if (input.matchDate) {
      const { normalizedDate } = this.normalizeMatchDate(input.matchDate);
      match.matchDate = normalizedDate;
    }

    if (input.opponentName) {
      const trimmed = input.opponentName.trim();
      if (!trimmed) {
        throw new Error("Validation Error: Opponent name cannot be empty.");
      }
      match.opponentName = trimmed;
    }

    return match.save();
  }

  /**
   * Computes accurate historical match participation and individual scoring statistics for a player.
   *
   * Rules:
   * 1. Only finalized MatchParticipant records count toward matches played.
   * 2. Draft matches must never appear in official player match statistics.
   * 3. A Match document without a MatchParticipant record never counts as a match played.
   * 4. Average score, highest score, and lowest score are accurately computed.
   */
  static async getPlayerMatchStats(playerId: string): Promise<PlayerMatchHistoryDTO | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(playerId)
      .populate<{ sportId: { _id: Types.ObjectId; name: string } }>("sportId", "name")
      .exec();

    if (!player) {
      return null;
    }

    // Find all participation records for this player
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

    // Filter strictly to finalized matches
    const finalizedParticipations = participantDocs.filter(
      (doc) => doc.matchId && doc.matchId.status === "finalized"
    );

    const totalMatches = finalizedParticipations.length;
    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;

    const history: Array<{
      matchId: string;
      matchDate: Date;
      sportName: string;
      opponentName: string;
      score: number;
    }> = [];

    if (totalMatches > 0) {
      const scores = finalizedParticipations.map((p) => p.score);
      const sum = scores.reduce((acc, s) => acc + s, 0);
      averageScore = Number((sum / totalMatches).toFixed(1));
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);

      for (const p of finalizedParticipations) {
        history.push({
          matchId: p.matchId._id.toString(),
          matchDate: p.matchId.matchDate,
          sportName: p.matchId.sportId?.name || "Unassigned",
          opponentName: p.matchId.opponentName,
          score: p.score,
        });
      }
    }

    return {
      player: {
        id: player._id.toString(),
        fullName: player.fullName,
        sportId: player.sportId ? player.sportId._id.toString() : "",
        sportName: player.sportId?.name || "Unassigned",
      },
      totalMatches,
      totalMatchesPlayed: totalMatches,
      averageScore,
      highestScore,
      lowestScore,
      history,
      matchHistory: history,
    };
  }
}
