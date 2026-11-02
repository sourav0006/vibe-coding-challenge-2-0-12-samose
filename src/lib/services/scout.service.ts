import { connectToDatabase } from "@/lib/db";
import { ScoutModel, UserModel, type IScout } from "@/models";
import type { CreateScoutInput, UpdateScoutInput } from "@/lib/validation";

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
    return ScoutModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec();
  }
}
