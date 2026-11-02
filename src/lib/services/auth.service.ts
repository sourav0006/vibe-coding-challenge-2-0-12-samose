import { connectToDatabase } from "@/lib/db";
import { UserModel, ActivationCodeModel, type UserRole } from "@/models";
import {
  hashPassword,
  verifyPassword,
  generateActivationCode,
  hashActivationCode,
  verifyActivationCode,
  computeActivationExpiration,
} from "@/lib/auth";
import type { LoginInput, ActivateAccountInput } from "@/lib/validation";

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  /**
   * Authenticates credentials and verifies role consistency.
   * Produces generic error messages to avoid user enumeration attacks.
   */
  static async authenticate(input: LoginInput): Promise<SafeUser> {
    await connectToDatabase();

    const normalizedEmail = input.email.trim().toLowerCase();

    // Query with explicit +passwordHash inclusion
    const user = await UserModel.findOne({ email: normalizedEmail })
      .select("+passwordHash")
      .exec();

    // Reject unknown email with generic message
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Reject inactive accounts
    if (!user.isActive) {
      throw new Error("Your account is currently inactive. Please complete activation or contact the academy coach.");
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Strictly enforce role isolation
    if (user.role !== input.requestedRole) {
      throw new Error("Invalid email or password");
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Issues a single-use, time-limited activation code for an inactive Player or Scout.
   * Restricted to invocation by Coach.
   */
  static async issueActivationCode(
    targetUserId: string,
    expiresInHours = 24
  ): Promise<{ code: string; expiresAt: Date }> {
    await connectToDatabase();

    const targetUser = await UserModel.findById(targetUserId).exec();
    if (!targetUser) {
      throw new Error("Validation Error: Target account does not exist.");
    }

    if (targetUser.isActive) {
      throw new Error("Conflict: This account is already active.");
    }

    if (targetUser.role === "coach") {
      throw new Error("Validation Error: Coach accounts cannot use activation codes.");
    }

    const plaintextCode = generateActivationCode();
    const codeHash = await hashActivationCode(plaintextCode);
    const expiresAt = computeActivationExpiration(expiresInHours);

    // Invalidate any previously unconsumed codes for this user
    await ActivationCodeModel.updateMany(
      { userId: targetUser._id, usedAt: null },
      { $set: { usedAt: new Date() } }
    ).exec();

    // Persist new hashed activation code
    await ActivationCodeModel.create({
      userId: targetUser._id,
      codeHash,
      expiresAt,
    });

    return {
      code: plaintextCode,
      expiresAt,
    };
  }

  /**
   * Activates an account atomically with a verified code, creating the user's password.
   */
  static async activateAccount(input: ActivateAccountInput): Promise<SafeUser> {
    await connectToDatabase();

    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await UserModel.findOne({ email: normalizedEmail }).exec();

    // Avoid leaking whether email exists
    if (!user || user.isActive || user.role === "coach") {
      throw new Error("Invalid activation request. The account is either already active, invalid, or does not exist.");
    }

    // Find active, unexpired, unconsumed codes for this user
    const codes = await ActivationCodeModel.find({
      userId: user._id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select("+codeHash")
      .exec();

    let matchedCodeDoc = null;

    for (const codeDoc of codes) {
      const isMatch = await verifyActivationCode(input.code, codeDoc.codeHash);
      if (isMatch) {
        matchedCodeDoc = codeDoc;
        break;
      }
    }

    if (!matchedCodeDoc) {
      throw new Error("Invalid, expired, or previously used activation code.");
    }

    // Atomic update: claim activation code and prevent concurrent consumption race condition
    const claimedCode = await ActivationCodeModel.findOneAndUpdate(
      {
        _id: matchedCodeDoc._id,
        usedAt: null,
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true }
    ).exec();

    if (!claimedCode) {
      throw new Error("Conflict: This activation code was already used by a concurrent request.");
    }

    // Hash the new password and activate the user account atomically
    const passwordHash = await hashPassword(input.password);

    const activatedUser = await UserModel.findOneAndUpdate(
      {
        _id: user._id,
        isActive: false,
      },
      {
        $set: {
          passwordHash,
          isActive: true,
        },
      },
      { new: true }
    ).exec();

    if (!activatedUser) {
      throw new Error("Conflict: Account has already been activated.");
    }

    return {
      id: activatedUser._id.toString(),
      email: activatedUser.email,
      role: activatedUser.role,
    };
  }

  /**
   * Controlled initialization of the single Coach account.
   * Idempotent: Does not overwrite existing Coach credentials.
   */
  static async initializeCoach(
    email: string,
    password: string
  ): Promise<{ created: boolean; message: string; email: string }> {
    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();

    const existingCoach = await UserModel.findOne({ role: "coach" }).exec();
    if (existingCoach) {
      return {
        created: false,
        message: "Coach account is already provisioned.",
        email: existingCoach.email,
      };
    }

    // Also verify email isn't used by another role
    const emailConflict = await UserModel.findOne({ email: normalizedEmail }).exec();
    if (emailConflict) {
      throw new Error(`Email ${normalizedEmail} is already registered to a different role.`);
    }

    const passwordHash = await hashPassword(password);

    const coach = new UserModel({
      email: normalizedEmail,
      passwordHash,
      role: "coach",
      isActive: true,
    });

    await coach.save();

    return {
      created: true,
      message: "Coach account successfully initialized.",
      email: normalizedEmail,
    };
  }
}
