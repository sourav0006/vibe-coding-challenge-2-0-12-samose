import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type MatchStatus = "draft" | "finalized";

export interface IMatch extends Document {
  title: string;
  normalizedTitle: string;
  sportId: Types.ObjectId;
  matchDate: Date;
  opponentName: string;
  normalizedOpponent: string;
  status: MatchStatus;
  finalizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    title: {
      type: String,
      required: [true, "Match title is required"],
      trim: true,
      default: "Match Fixture",
    },
    normalizedTitle: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "match fixture",
    },
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
    normalizedOpponent: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: function (this: IMatch) {
        return (this.opponentName || "").trim().toLowerCase();
      },
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

// Pre-validate hook to ensure normalized strings are always populated
matchSchema.pre("validate", function () {
  if (this.title) {
    this.title = this.title.trim();
    this.normalizedTitle = this.title.toLowerCase();
  } else if (!this.normalizedTitle && this.opponentName) {
    this.title = `${this.opponentName} Fixture`;
    this.normalizedTitle = this.title.toLowerCase();
  }
  if (this.opponentName) {
    this.opponentName = this.opponentName.trim();
    this.normalizedOpponent = this.opponentName.toLowerCase();
  }
});

// Compound unique index ensuring: Sport + Match Date + Opponent + Match Title uniqueness
matchSchema.index(
  { sportId: 1, matchDate: 1, normalizedOpponent: 1, normalizedTitle: 1 },
  { unique: true }
);

// Compound index for sport matches ordered by date
matchSchema.index({ sportId: 1, matchDate: -1 });

export const MatchModel: Model<IMatch> =
  (mongoose.models.Match as Model<IMatch>) || mongoose.model<IMatch>("Match", matchSchema);
