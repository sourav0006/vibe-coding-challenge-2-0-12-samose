import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ICoachRemark extends Document {
  playerId: Types.ObjectId;
  coachId?: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const coachRemarkSchema = new Schema<ICoachRemark>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Player reference is required"],
      index: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Remark content is required"],
      trim: true,
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

// Index to efficiently query player remarks chronologically
coachRemarkSchema.index({ playerId: 1, createdAt: -1 });

export const CoachRemarkModel: Model<ICoachRemark> =
  (mongoose.models.CoachRemark as Model<ICoachRemark>) ||
  mongoose.model<ICoachRemark>("CoachRemark", coachRemarkSchema);
