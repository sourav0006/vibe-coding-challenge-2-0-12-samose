import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type MatchStatus = "draft" | "finalized";

export interface IMatch extends Document {
  sportId: Types.ObjectId;
  matchDate: Date;
  opponentName: string;
  status: MatchStatus;
  finalizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    sportId: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: [true, "Sport reference is required"],
      index: true,
    },
    matchDate: {
      type: Date,
      required: [true, "Match date is required"],
      index: true,
    },
    opponentName: {
      type: String,
      required: [true, "Opponent name is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "finalized"],
        message: "Status must be either draft or finalized",
      },
      default: "draft",
      index: true,
    },
    finalizedAt: {
      type: Date,
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

// Compound index for sport matches ordered by date
matchSchema.index({ sportId: 1, matchDate: -1 });

export const MatchModel: Model<IMatch> =
  (mongoose.models.Match as Model<IMatch>) || mongoose.model<IMatch>("Match", matchSchema);
