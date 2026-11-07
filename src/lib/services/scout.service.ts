import { connectToDatabase } from "@/lib/db";
import { ScoutModel, UserModel, ActivationCodeModel, type IScout } from "@/models";
import { hashPassword } from "@/lib/auth";
import { AuthService } from "./auth.service";
import type {
  CreateScoutInput,
  UpdateScoutInput,
  CreateScoutAccountInput,
  ScoutListQueryInput,
} from "@/lib/validation";

export interface PopulatedScoutResult {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  isActive: boolean;
  userIsActive: boolean;
  status: "active" | "pending" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoutStatsResult {
  totalScouts: number;
  activeScouts: number;
  pendingScouts: number;
}

export type ScoutStatsDTO = ScoutStatsResult;

export class ScoutService {
  /**
   * Finds a scout profile by associated User ID
   */
  static async findByUserId(userId: string): Promise<IScout | null> {
    await connectToDatabase();
    return ScoutModel.findOne({ userId }).exec();
  }

  /**
   * Finds a scout profile by Scout ID
   */
  static async findById(id: string): Promise<IScout | null> {
    await connectToDatabase();
    return ScoutModel.findById(id).exec();
  }

  /**
   * Lists all active scouts
   */
  static async findAllActive(): Promise<IScout[]> {
    await connectToDatabase();
    return ScoutModel.find({ isActive: true }).sort({ fullName: 1 }).exec();
  }

  /**
   * Creates a new scout profile ensuring valid User reference
   */
  static async create(input: CreateScoutInput): Promise<IScout> {
    await connectToDatabase();

    const user = await UserModel.findById(input.userId).exec();
    if (!user) {
      throw new Error("Validation Error: Referenced User does not exist.");
    }
    if (user.role !== "scout") {
      throw new Error("Validation Error: User must have the 'scout' role to create a scout profile.");
    }

    const existing = await ScoutModel.findOne({ userId: input.userId }).exec();
    if (existing) {
      throw new Error("Conflict: A scout profile already exists for this user.");
    }

    const scout = new ScoutModel({
      userId: input.userId,
      fullName: input.fullName.trim(),
      isActive: input.isActive ?? true,
    });

    return scout.save();
  }

  /**
   * Updates an existing scout profile
   */
  static async update(id: string, input: UpdateScoutInput): Promise<IScout | null> {
    await connectToDatabase();
    return ScoutModel.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).exec();
  }

  /**
   * Atomically creates a User (role: scout, isActive: false), Scout profile, and 24h single-use activation code.
   * If any step fails, safely rolls back all created records.
   */
  static async createScoutWithAccount(input: CreateScoutAccountInput): Promise<{
    scout: IScout;
    userId: string;
    email: string;
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

    // Temporary placeholder password hash until scout completes activation
    const placeholderPasswordHash = await hashPassword(crypto.randomUUID());

    let createdUser: InstanceType<typeof UserModel> | null = null;
    let createdScout: IScout | null = null;

    try {
      // Step A: Create User
      createdUser = new UserModel({
        email: normalizedEmail,
        passwordHash: placeholderPasswordHash,
        role: "scout",
        isActive: false, // Inactive until activation code is redeemed
      });
      await createdUser.save();

      // Step B: Create Scout profile
      createdScout = new ScoutModel({
        userId: createdUser._id,
        fullName: input.fullName.trim(),
        isActive: true,
      });
      await createdScout.save();

      // Step C: Generate single-use 24h activation code
      const { code, expiresAt } = await AuthService.issueActivationCode(
        createdUser._id.toString(),
        24
      );

      return {
        scout: createdScout,
        userId: createdUser._id.toString(),
        email: createdUser.email,
        activationCode: code,
        expiresAt,
      };
    } catch (error) {
      // Safe rollback on failure
      if (createdScout) {
        await ScoutModel.findByIdAndDelete(createdScout._id).exec().catch(() => {});
      }
      if (createdUser) {
        await ActivationCodeModel.deleteMany({ userId: createdUser._id }).exec().catch(() => {});
        await UserModel.findByIdAndDelete(createdUser._id).exec().catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Retrieves a paginated and filtered list of scouts with populated User data and statistics.
   */
  static async findScoutsPaginated(query: Partial<ScoutListQueryInput> = {}): Promise<{
    scouts: PopulatedScoutResult[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    stats: ScoutStatsResult;
  }> {
    await connectToDatabase();
    type MongoosePipeline = Parameters<typeof ScoutModel.aggregate>[0];

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    // Base lookup pipeline for joining user data
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
    ];

    // Filter stage
    const matchStage: Record<string, unknown> = {};

    if (query.status === "active") {
      matchStage.isActive = true;
      matchStage["user.isActive"] = true;
    } else if (query.status === "pending") {
      matchStage.isActive = true;
      matchStage["user.isActive"] = false;
    } else if (query.status === "archived") {
      matchStage.isActive = false;
    }

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
    const countResult = await ScoutModel.aggregate(countPipeline as unknown as MongoosePipeline).exec();
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Sort & paginate
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const results = await ScoutModel.aggregate(pipeline as unknown as MongoosePipeline).exec();

    const scouts: PopulatedScoutResult[] = results.map((item) => {
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
        isActive: item.isActive,
        userIsActive: Boolean(item.user?.isActive),
        status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const stats = await ScoutService.getScoutStats();

    return {
      scouts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats,
    };
  }

  /**
   * Aggregates live count statistics across all scouts.
   */
  static async getScoutStats(): Promise<ScoutStatsResult> {
    await connectToDatabase();
    type MongoosePipeline = Parameters<typeof ScoutModel.aggregate>[0];

    const pipeline = [
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
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$isActive", true] }, { $eq: ["$user.isActive", true] }] },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$isActive", true] }, { $eq: ["$user.isActive", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const result = await ScoutModel.aggregate(pipeline as unknown as MongoosePipeline).exec();
    const item = result[0] || { total: 0, active: 0, pending: 0 };

    return {
      totalScouts: item.total || 0,
      activeScouts: item.active || 0,
      pendingScouts: item.pending || 0,
    };
  }

  /**
   * Regenerates a single-use activation code for an inactive scout.
   */
  static async regenerateActivationCode(scoutId: string): Promise<{
    code: string;
    expiresAt: Date;
    scout: { id: string; fullName: string; email: string };
  }> {
    await connectToDatabase();

    const scout = await ScoutModel.findById(scoutId).exec();
    if (!scout) {
      throw new Error("Scout not found.");
    }

    if (!scout.isActive) {
      throw new Error("Validation Error: Cannot generate an activation code for an archived scout.");
    }

    const user = await UserModel.findById(scout.userId).exec();
    if (!user) {
      throw new Error("Associated user record not found.");
    }

    if (user.isActive) {
      throw new Error("Conflict: This scout account is already active and cannot be re-activated.");
    }

    const result = await AuthService.issueActivationCode(user._id.toString(), 24);

    return {
      code: result.code,
      expiresAt: result.expiresAt,
      scout: {
        id: scout._id.toString(),
        fullName: scout.fullName,
        email: user.email,
      },
    };
  }
}
