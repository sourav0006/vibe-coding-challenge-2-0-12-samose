import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IRateLimitDoc extends Document {
  key: string;
  timestamps: Date[];
  expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimitDoc>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamps: {
      type: [Date],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: false }
);

export const RateLimitModel: Model<IRateLimitDoc> =
  (mongoose.models.RateLimit as Model<IRateLimitDoc>) ||
  mongoose.model<IRateLimitDoc>("RateLimit", rateLimitSchema);

