import mongoose, { Schema, type Document, type Model } from "mongoose";

export type UserRole = "coach" | "player" | "scout";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["coach", "player", "scout"],
        message: "Role must be either coach, player, or scout",
      },
      required: [true, "Role is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Enforce single Coach constraint at database index level
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "coach" },
    name: "single_coach_unique_index",
  }
);

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", userSchema);
