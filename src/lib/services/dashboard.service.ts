import { connectToDatabase } from "@/lib/db";
import {
  PlayerModel,
  SportModel,
  ActivationCodeModel,
  MatchModel,
  MatchParticipantModel,
} from "@/models";

export interface CoachStats {
  totalPlayers: number;
  totalSports: number;
  activePlayers: number;
  pendingActivations: number;
  totalMatches: number;
  totalParticipations: number;
}

export interface RecentPlayerItem {
  id: string;
  fullName: string;
  email: string;
  sportName: string;
  status: "active" | "pending" | "archived";
  createdAt: Date;
}

export interface RecentMatchItem {
  id: string;
  sportName: string;
  opponentName: string;
  matchDate: Date;
  status: "draft" | "finalized";
  participantCount: number;
  averageScore: number | null;
}

export interface ActivationCodeMetadataItem {
  id: string;
  playerId?: string;
  playerName?: string;
  userEmail: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  status: "pending" | "used" | "expired";
}

export class DashboardService {
  /**
   * Computes actual academy-level metrics from real MongoDB collections.
   */
  static async getCoachStats(): Promise<CoachStats> {
    await connectToDatabase();

    // 1. Total players count
    const totalPlayers = await PlayerModel.countDocuments().exec();

    // 2. Total active sports in catalogue
    const totalSports = await SportModel.countDocuments({ isActive: true }).exec();

    // 3. Active players (Player isActive: true AND User isActive: true)
    const activePlayersAggregation = await PlayerModel.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.isActive": true } },
      { $count: "count" },
    ]).exec();
    const activePlayers = activePlayersAggregation[0]?.count || 0;

    // 4. Pending activations (Unused, unexpired activation codes for player users)
    const pendingActivationsAggregation = await ActivationCodeModel.aggregate([
      {
        $match: {
          usedAt: null,
          expiresAt: { $gt: new Date() },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.role": "player" } },
      { $count: "count" },
    ]).exec();
    const pendingActivations = pendingActivationsAggregation[0]?.count || 0;

    // 5. Total finalized matches count
    const totalMatches = await MatchModel.countDocuments({ status: "finalized" }).exec();

    // 6. Total player participations recorded in finalized matches
    const finalizedMatches = await MatchModel.find({ status: "finalized" }).select("_id").exec();
    const finalizedMatchIds = finalizedMatches.map((m) => m._id);
    const totalParticipations = await MatchParticipantModel.countDocuments({
      matchId: { $in: finalizedMatchIds },
    }).exec();

    return {
      totalPlayers,
      totalSports,
      activePlayers,
      pendingActivations,
      totalMatches,
      totalParticipations,
    };
  }

  /**
   * Retrieves recent matches for the overview dashboard.
   */
  static async getRecentMatches(limit = 5): Promise<RecentMatchItem[]> {
    await connectToDatabase();

    const matches = await MatchModel.find()
      .sort({ matchDate: -1, createdAt: -1 })
      .limit(limit)
      .populate<{ sportId: { _id: string; name: string } }>("sportId", "name")
      .exec();

    return Promise.all(
      matches.map(async (m) => {
        const participants = await MatchParticipantModel.find({ matchId: m._id }).select("score").exec();
        const participantCount = participants.length;
        let averageScore: number | null = null;
        if (participantCount > 0) {
          const sum = participants.reduce((acc, p) => acc + p.score, 0);
          averageScore = Number((sum / participantCount).toFixed(1));
        }

        return {
          id: m._id.toString(),
          sportName: m.sportId?.name || "Unassigned",
          opponentName: m.opponentName,
          matchDate: m.matchDate,
          status: m.status || "draft",
          participantCount,
          averageScore,
        };
      })
    );
  }

  /**
   * Retrieves the most recently created players for the overview dashboard.
   */
  static async getRecentPlayers(limit = 5): Promise<RecentPlayerItem[]> {
    await connectToDatabase();

    const players = await PlayerModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ userId: { _id: string; email: string; isActive: boolean } }>("userId", "email isActive")
      .populate<{ sportId: { _id: string; name: string } }>("sportId", "name")
      .exec();

    return players.map((p) => {
      let status: "active" | "pending" | "archived" = "pending";
      if (!p.isActive) {
        status = "archived";
      } else if (p.userId?.isActive) {
        status = "active";
      }

      return {
        id: p._id.toString(),
        fullName: p.fullName,
        email: p.userId?.email || "Unknown",
        sportName: p.sportId?.name || "Unassigned",
        status,
        createdAt: p.createdAt,
      };
    });
  }

  /**
   * Retrieves safe activation code metadata for all players without ever exposing code hashes.
   */
  static async getActivationCodesMetadata(limit = 50): Promise<ActivationCodeMetadataItem[]> {
    await connectToDatabase();

    const codes = await ActivationCodeModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ userId: { _id: string; email: string; role: string } }>("userId", "email role")
      .exec();

    // Filter to player codes
    const playerCodes = codes.filter((c) => c.userId && c.userId.role === "player");

    // Fetch corresponding players for display names
    const userIds = playerCodes.map((c) => c.userId._id);
    const players = await PlayerModel.find({ userId: { $in: userIds } }).exec();
    const playerByUser = new Map<string, { id: string; fullName: string }>();
    players.forEach((p) => {
      playerByUser.set(p.userId.toString(), {
        id: p._id.toString(),
        fullName: p.fullName,
      });
    });

    const now = new Date();

    return playerCodes.map((c) => {
      const playerInfo = playerByUser.get(c.userId._id.toString());
      let status: "pending" | "used" | "expired" = "pending";

      if (c.usedAt) {
        status = "used";
      } else if (now > c.expiresAt) {
        status = "expired";
      }

      return {
        id: c._id.toString(),
        playerId: playerInfo?.id,
        playerName: playerInfo?.fullName,
        userEmail: c.userId.email,
        expiresAt: c.expiresAt,
        usedAt: c.usedAt,
        createdAt: c.createdAt,
        status,
      };
    });
  }
}
