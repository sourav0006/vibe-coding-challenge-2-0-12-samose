import { connectToDatabase } from "@/lib/db";
import { UserModel, type IUser } from "@/models";
import type { CreateUserInput } from "@/lib/validation";

export class UserService {
  /**
   * Finds a user by normalized email address
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    return UserModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  /**
   * Finds a user by ID
   */
  static async findById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    return UserModel.findById(id).exec();
  }

  /**
   * Creates a new user record.
   * Enforces the single Coach constraint at service level before write.
   */
  static async create(input: CreateUserInput): Promise<IUser> {
    await connectToDatabase();

    if (input.role === "coach") {
      const existingCoach = await UserModel.findOne({ role: "coach" }).exec();
      if (existingCoach) {
        throw new Error("Conflict: A Coach account already exists. Only one Coach account is allowed.");
      }
    }

    const user = new UserModel({
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      isActive: input.isActive ?? true,
    });

    return user.save();
  }

  /**
   * Checks if an email is already registered
   */
  static async existsByEmail(email: string): Promise<boolean> {
    await connectToDatabase();
    const count = await UserModel.countDocuments({ email: email.trim().toLowerCase() }).exec();
    return count > 0;
  }
}
