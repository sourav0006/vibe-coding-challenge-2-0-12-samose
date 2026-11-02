import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ISportHistoryEntry {
  sportId: Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
}

export interface IPlayer extends Document {
  userId: Types.ObjectId;
  fullName: string;
  age: number;
  sportId: Types.ObjectId;
  isActive: boolean;
  sportHistory?: ISportHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const sportHistoryEntrySchema = new Schema<ISportHistoryEntry>(
  {
    sportId: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const playerSchema = new Schema<IPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [4, "Player age must be at least 4 years"],
      max: [100, "Player age cannot exceed 100 years"],
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: [true, "Sport reference is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sportHistory: {
      type: [sportHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PlayerModel: Model<IPlayer> =
  (mongoose.models.Player as Model<IPlayer>) || mongoose.model<IPlayer>("Player", playerSchema);
