import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AttendanceStatus = "present" | "absent";

export interface IAttendance extends Document {
  sessionId: Types.ObjectId;
  playerId: Types.ObjectId;
  status: AttendanceStatus;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "PracticeSession",
      required: [true, "Session reference is required"],
      index: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Player reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["present", "absent"],
        message: "Status must be either present or absent",
      },
      required: [true, "Attendance status is required"],
    },
    markedAt: {
      type: Date,
      default: Date.now,
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

// Compound unique index prevents duplicate attendance records for the same player in a session
attendanceSchema.index(
  { sessionId: 1, playerId: 1 },
  { unique: true, name: "unique_session_player_attendance" }
);

export const AttendanceModel: Model<IAttendance> =
  (mongoose.models.Attendance as Model<IAttendance>) ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);
