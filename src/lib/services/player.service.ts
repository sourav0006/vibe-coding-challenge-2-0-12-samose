import { connectToDatabase } from "@/lib/db";
import { PlayerModel, SportModel, UserModel, ActivationCodeModel, type IPlayer } from "@/models";
import { hashPassword } from "@/lib/auth";
import { AuthService } from "./auth.service";
import type {
  CreatePlayerInput,
  UpdatePlayerInput,
  CreatePlayerAccountInput,
  UpdatePlayerDetailsInput,
  PlayerQueryInput,
} from "@/lib/validation";

export interface PopulatedPlayerResult {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  age: number;
  sportId: string;
  sportName: string;
  isActive: boolean;
  userIsActive: boolean;
  status: "active" | "pending" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerDetailsResult extends PopulatedPlayerResult {
  activationStatus?: {
    hasPendingCode: boolean;
    expiresAt?: Date;
    isExpired?: boolean;
    usedAt?: Date;
  };
}

export class PlayerService {
  /**
   * Finds a player profile by its associated User ID
   */
  static async findByUserId(userId: string): Promise<IPlayer | null> {
    await connectToDatabase();
    return PlayerModel.findOne({ userId }).exec();
  }

  /**
   * Finds a player profile by Player ID
   */
  static async findById(id: string): Promise<IPlayer | null> {
    await connectToDatabase();
    return PlayerModel.findById(id).exec();
  }

  /**
   * Finds all active players registered for a specific sport
   */
  static async findBySport(sportId: string): Promise<IPlayer[]> {
    await connectToDatabase();
    return PlayerModel.find({ sportId, isActive: true }).sort({ fullName: 1 }).exec();
  }

  /**
   * Creates a new player profile ensuring referenced User and Sport exist
   */
  static async create(input: CreatePlayerInput): Promise<IPlayer> {
    await connectToDatabase();

    // Verify user exists and has player role
    const user = await UserModel.findById(input.userId).exec();
    if (!user) {
      throw new Error("Validation Error: Referenced User does not exist.");
    }
    if (user.role !== "player") {
      throw new Error("Validation Error: User must have the 'player' role to create a player profile.");
    }

    // Check if player profile already exists for this user
    const existing = await PlayerModel.findOne({ userId: input.userId }).exec();
    if (existing) {
      throw new Error("Conflict: A player profile already exists for this user.");
    }

    // Verify sport exists
    const sport = await SportModel.findById(input.sportId).exec();
    if (!sport) {
      throw new Error("Validation Error: Referenced Sport does not exist.");
    }

    const now = new Date();
    const player = new PlayerModel({
      userId: input.userId,
      fullName: input.fullName.trim(),
      age: input.age,
      sportId: input.sportId,
      isActive: input.isActive ?? true,
      sportHistory: [
        {
          sportId: input.sportId,
          effectiveFrom: now,
          effectiveTo: null,
        },
      ],
    });

    return player.save();
  }

  /**
   * Atomically creates a User (role: player, isActive: false), Player profile, and 24h single-use activation code.
   * If any step fails, safely rolls back all created records to avoid orphans.
   */
  static async createPlayerWithAccount(input: CreatePlayerAccountInput): Promise<{
    player: IPlayer;
    userId: string;
    email: string;
    sportName: string;
    activationCode: string;
    expiresAt: Date;
  }> {
    await connectToDatabase();

    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Verify email uniqueness
    const existingUser = await UserModel.findOne({ email: normalizedEmail }).exec();
    if (existingUser) {
      throw new Error(`Conflict: An account with email "${normalizedEmail}" already exists.`);
    }

    // 2. Verify referenced Sport exists and is ACTIVE
    const sport = await SportModel.findById(input.sportId).exec();
    if (!sport) {
      throw new Error("Validation Error: Referenced Sport does not exist.");
    }
    if (!sport.isActive) {
      throw new Error("Validation Error: Cannot assign player to an inactive sport.");
    }

    // Temporary placeholder password hash until user completes activation
    // Use an unguessable unique random string hashed with bcrypt
    const placeholderPasswordHash = await hashPassword(crypto.randomUUID());

    let createdUser: InstanceType<typeof UserModel> | null = null;
    let createdPlayer: IPlayer | null = null;

    try {
      // Step A: Create User
      createdUser = new UserModel({
        email: normalizedEmail,
        passwordHash: placeholderPasswordHash,
        role: "player",
        isActive: false, // inactive until activation code is redeemed
      });
      await createdUser.save();

      // Step B: Create Player profile
      const now = new Date();
      createdPlayer = new PlayerModel({
        userId: createdUser._id,
        fullName: input.fullName.trim(),
        age: input.age,
        sportId: sport._id,
        isActive: true,
        sportHistory: [
          {
            sportId: sport._id,
            effectiveFrom: now,
            effectiveTo: null,
          },
        ],
      });
      await createdPlayer.save();

      // Step C: Generate single-use 24h activation code
      const { code, expiresAt } = await AuthService.issueActivationCode(
        createdUser._id.toString(),
        24
      );

      return {
        player: createdPlayer,
        userId: createdUser._id.toString(),
        email: createdUser.email,
        sportName: sport.name,
        activationCode: code,
        expiresAt,
      };
    } catch (error) {
      // Safe rollback on failure
      if (createdPlayer) {
        await PlayerModel.findByIdAndDelete(createdPlayer._id).exec().catch(() => {});
      }
      if (createdUser) {
        await ActivationCodeModel.deleteMany({ userId: createdUser._id }).exec().catch(() => {});
        await UserModel.findByIdAndDelete(createdUser._id).exec().catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Retrieves a paginated and filtered list of players with populated Sport and User data.
   */
  static async findPlayersPaginated(query: Partial<PlayerQueryInput> = {}): Promise<{
    players: PopulatedPlayerResult[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    await connectToDatabase();
    const { Types } = await import("mongoose");
    type MongoosePipeline = Parameters<typeof PlayerModel.aggregate>[0];

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    // Build aggregation pipeline to allow joined search on user.email and sport
    const pipeline: Array<Record<string, unknown>> = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "sports",
          localField: "sportId",
          foreignField: "_id",
          as: "sport",
        },
      },
      {
        $unwind: {
          path: "$sport",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Filter by sport
    const matchStage: Record<string, unknown> = {};
    if (query.sportId && query.sportId !== "all") {
      if (Types.ObjectId.isValid(query.sportId)) {
        matchStage.sportId = new Types.ObjectId(query.sportId);
      }
    }

    // Filter by status
    if (query.status === "active") {
      matchStage.isActive = true;
      matchStage["user.isActive"] = true;
    } else if (query.status === "pending") {
      matchStage.isActive = true;
      matchStage["user.isActive"] = false;
    } else if (query.status === "archived") {
      matchStage.isActive = false;
    }

    // Filter by search query (name or email)
    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(sanitized, "i");
      matchStage.$or = [
        { fullName: searchRegex },
        { "user.email": searchRegex },
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Count total matching
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await PlayerModel.aggregate(countPipeline as unknown as MongoosePipeline).exec();
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch paginated results sorted by createdAt desc
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const results = await PlayerModel.aggregate(pipeline as unknown as MongoosePipeline).exec();

    const players: PopulatedPlayerResult[] = results.map((item) => {
      let status: "active" | "pending" | "archived" = "pending";
      if (!item.isActive) {
        status = "archived";
      } else if (item.user?.isActive) {
        status = "active";
      }

      return {
        id: item._id.toString(),
        userId: item.userId.toString(),
        fullName: item.fullName,
        email: item.user?.email || "Unknown",
        age: item.age,
        sportId: item.sportId.toString(),
        sportName: item.sport?.name || "Unassigned",
        isActive: item.isActive,
        userIsActive: Boolean(item.user?.isActive),
        status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return {
      players,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single player details including activation status.
   */
  static async getPlayerDetails(id: string): Promise<PlayerDetailsResult | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(id)
      .populate<{ userId: { _id: string; email: string; isActive: boolean } }>("userId", "email isActive")
      .populate<{ sportId: { _id: string; name: string; isActive: boolean } }>("sportId", "name isActive")
      .exec();

    if (!player) {
      return null;
    }

    let status: "active" | "pending" | "archived" = "pending";
    if (!player.isActive) {
      status = "archived";
    } else if (player.userId?.isActive) {
      status = "active";
    }

    let activationStatus: PlayerDetailsResult["activationStatus"] = undefined;

    // If user is pending activation, check latest activation code status
    if (status === "pending") {
      const latestCode = await ActivationCodeModel.findOne({ userId: player.userId._id })
        .sort({ createdAt: -1 })
        .exec();

      if (latestCode) {
        const isExpired = new Date() > latestCode.expiresAt;
        const hasPendingCode = !latestCode.usedAt && !isExpired;
        activationStatus = {
          hasPendingCode,
          expiresAt: latestCode.expiresAt,
          isExpired,
          usedAt: latestCode.usedAt,
        };
      }
    }

    return {
      id: player._id.toString(),
      userId: player.userId._id.toString(),
      fullName: player.fullName,
      email: player.userId.email,
      age: player.age,
      sportId: player.sportId._id.toString(),
      sportName: player.sportId.name || "Unassigned",
      isActive: player.isActive,
      userIsActive: player.userId.isActive,
      status,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      activationStatus,
    };
  }

  /**
   * Updates player details (name, age, sport).
   */
  static async updatePlayerDetails(
    id: string,
    input: UpdatePlayerDetailsInput
  ): Promise<IPlayer | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(id).exec();
    if (!player) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (input.fullName) {
      updateData.fullName = input.fullName.trim();
    }

    if (input.age !== undefined) {
      updateData.age = input.age;
    }

    if (input.sportId && input.sportId !== player.sportId.toString()) {
      const sport = await SportModel.findById(input.sportId).exec();
      if (!sport) {
        throw new Error("Validation Error: Referenced Sport does not exist.");
      }
      if (!sport.isActive) {
        throw new Error("Validation Error: Cannot reassign player to an inactive sport.");
      }

      const now = new Date();
      const history = Array.isArray(player.sportHistory) ? [...player.sportHistory] : [];
      if (history.length === 0) {
        // Backfill previous sport assignment entry for legacy records
        history.push({
          sportId: player.sportId,
          effectiveFrom: player.createdAt || now,
          effectiveTo: now,
        });
      } else {
        // Close open history entry
        const openEntry = history.find((h) => !h.effectiveTo);
        if (openEntry) {
          openEntry.effectiveTo = now;
        }
      }

      history.push({
        sportId: sport._id,
        effectiveFrom: now,
        effectiveTo: null,
      });

      updateData.sportId = sport._id;
      updateData.sportHistory = history;
    }

    return PlayerModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  /**
   * Safe archival / unarchival of a player profile.
   * Preserves all historical attendance and match records.
   */
  static async togglePlayerArchival(id: string, archive: boolean): Promise<IPlayer | null> {
    await connectToDatabase();

    const player = await PlayerModel.findById(id).exec();
    if (!player) {
      return null;
    }

    const newPlayerIsActive = !archive;

    // Update Player record
    player.isActive = newPlayerIsActive;
    await player.save();

    if (archive) {
      // When archiving, also deactivate User account to revoke login session immediately
      await UserModel.findByIdAndUpdate(player.userId, { isActive: false }).exec();
    } else {
      // When unarchiving, restore user account only if previously activated
      const hasBeenActivated = await ActivationCodeModel.findOne({
        userId: player.userId,
        usedAt: { $ne: null },
      }).exec();

      if (hasBeenActivated) {
        await UserModel.findByIdAndUpdate(player.userId, { isActive: true }).exec();
      }
    }

    return player;
  }

  /**
   * Regenerates an activation code for an inactive, unarchived player.
   * Invalidates any previously issued unconsumed code.
   */
  static async regenerateActivationCode(playerId: string): Promise<{
    code: string;
    expiresAt: Date;
    player: { id: string; fullName: string; email: string };
  }> {
    await connectToDatabase();

    const player = await PlayerModel.findById(playerId).exec();
    if (!player) {
      throw new Error("Player not found.");
    }

    if (!player.isActive) {
      throw new Error("Validation Error: Cannot generate an activation code for an archived player.");
    }

    const user = await UserModel.findById(player.userId).exec();
    if (!user) {
      throw new Error("Associated user record not found.");
    }

    if (user.isActive) {
      throw new Error("Conflict: This player account is already active and cannot be re-activated.");
    }

    const result = await AuthService.issueActivationCode(user._id.toString(), 24);

    return {
      code: result.code,
      expiresAt: result.expiresAt,
      player: {
        id: player._id.toString(),
        fullName: player.fullName,
        email: user.email,
      },
    };
  }

  /**
   * Updates an existing player profile
   */
  static async update(id: string, input: UpdatePlayerInput): Promise<IPlayer | null> {
    await connectToDatabase();

    if (input.sportId) {
      const sport = await SportModel.findById(input.sportId).exec();
      if (!sport) {
        throw new Error("Validation Error: Referenced Sport does not exist.");
      }
    }

    return PlayerModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec();
  }
}
