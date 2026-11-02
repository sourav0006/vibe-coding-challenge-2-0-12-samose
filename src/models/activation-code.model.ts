import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IActivationCode extends Document {
  userId: Types.ObjectId;
  codeHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const activationCodeSchema = new Schema<IActivationCode>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    codeHash: {
      type: String,
      required: [true, "Code hash is required"],
      select: false,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration timestamp is required"],
      index: true,
    },
    usedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.codeHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.codeHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for lookups and expiration filtering
activationCodeSchema.index({ userId: 1, expiresAt: 1 });

export const ActivationCodeModel: Model<IActivationCode> =
  (mongoose.models.ActivationCode as Model<IActivationCode>) ||
  mongoose.model<IActivationCode>("ActivationCode", activationCodeSchema);
