import { connectToDatabase } from "@/lib/db";
import { SportModel, type ISport } from "@/models";
import type { CreateSportInput, UpdateSportInput } from "@/lib/validation";

export class SportService {
  /**
   * Retrieves all active sports ordered by name
   */
  static async findAllActive(): Promise<ISport[]> {
    await connectToDatabase();
    return SportModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  /**
   * Finds a sport by its ID
   */
  static async findById(id: string): Promise<ISport | null> {
    await connectToDatabase();
    return SportModel.findById(id).exec();
  }

  /**
   * Finds a sport by case-insensitive name
   */
  static async findByName(name: string): Promise<ISport | null> {
    await connectToDatabase();
    const normalized = name.trim().toLowerCase();
    return SportModel.findOne({ normalizedName: normalized }).exec();
  }

  /**
   * Creates a new sport ensuring normalized uniqueness
   */
  static async create(input: CreateSportInput): Promise<ISport> {
    await connectToDatabase();
    const normalizedName = input.name.trim().toLowerCase();

    const existing = await SportModel.findOne({ normalizedName }).exec();
    if (existing) {
      throw new Error(`Conflict: Sport with name "${input.name}" already exists.`);
    }

    const sport = new SportModel({
      name: input.name.trim(),
      normalizedName,
      description: input.description?.trim(),
      isActive: input.isActive ?? true,
    });

    return sport.save();
  }

  /**
   * Retrieves all sports (active and inactive) along with their enrolled player counts.
   * Uses an aggregation pipeline to avoid N+1 queries.
   */
  static async findAllWithPlayerCounts(): Promise<
    Array<{
      id: string;
      name: string;
      normalizedName: string;
      description?: string;
      isActive: boolean;
      playerCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    await connectToDatabase();

    const results = await SportModel.aggregate([
      {
        $lookup: {
          from: "players",
          localField: "_id",
          foreignField: "sportId",
          as: "players",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          normalizedName: 1,
          description: 1,
          isActive: 1,
          playerCount: { $size: "$players" },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    return results.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      normalizedName: item.normalizedName,
      description: item.description,
      isActive: item.isActive,
      playerCount: item.playerCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  /**
   * Updates an existing sport
   */
  static async update(id: string, input: UpdateSportInput): Promise<ISport | null> {
    await connectToDatabase();

    const updateData: Record<string, unknown> = { ...input };
    if (input.name) {
      const normalizedName = input.name.trim().toLowerCase();
      // Ensure name isn't taken by a different sport
      const conflict = await SportModel.findOne({
        normalizedName,
        _id: { $ne: id },
      }).exec();

      if (conflict) {
        throw new Error(`Conflict: Sport with name "${input.name.trim()}" already exists.`);
      }

      updateData.name = input.name.trim();
      updateData.normalizedName = normalizedName;
    }

    if (input.description !== undefined) {
      updateData.description = input.description.trim();
    }

    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    return SportModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  /**
   * Idempotent seed helper for sports catalogue
   */
  static async upsertSeedSport(sportData: { name: string; description?: string }): Promise<ISport> {
    await connectToDatabase();
    const normalizedName = sportData.name.trim().toLowerCase();

    return SportModel.findOneAndUpdate(
      { normalizedName },
      {
        $setOnInsert: {
          name: sportData.name.trim(),
          normalizedName,
          description: sportData.description,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec() as Promise<ISport>;
  }
}
