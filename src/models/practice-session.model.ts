import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type SessionStatus = "open" | "closed";

export interface IPracticeSession extends Document {
  sportId: Types.ObjectId;
  sessionDate: Date;
  status: SessionStatus;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const practiceSessionSchema = new Schema<IPracticeSession>(
  {
    sportId: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: [true, "Sport reference is required"],
      index: true,
    },
    sessionDate: {
      type: Date,
      required: [true, "Session date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["open", "closed"],
        message: "Status must be either open or closed",
      },
      default: "open",
      index: true,
    },
    closedAt: {
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

// Compound index for efficient sport and sessionDate filtering
practiceSessionSchema.index({ sportId: 1, sessionDate: -1 });

export const PracticeSessionModel: Model<IPracticeSession> =
  (mongoose.models.PracticeSession as Model<IPracticeSession>) ||
  mongoose.model<IPracticeSession>("PracticeSession", practiceSessionSchema);
