import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IScout extends Document {
  userId: Types.ObjectId;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scoutSchema = new Schema<IScout>(
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

export const ScoutModel: Model<IScout> =
  (mongoose.models.Scout as Model<IScout>) || mongoose.model<IScout>("Scout", scoutSchema);
