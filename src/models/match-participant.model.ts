import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IMatchParticipant extends Document {
  matchId: Types.ObjectId;
  playerId: Types.ObjectId;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const matchParticipantSchema = new Schema<IMatchParticipant>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: [true, "Match reference is required"],
      index: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Player reference is required"],
      index: true,
    },
    score: {
      type: Number,
      required: [true, "Match score is required"],
      min: [0, "Score cannot be less than 0"],
      max: [10, "Score cannot exceed 10"],
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

// Compound unique index prevents duplicate participation records for the same player in a match
matchParticipantSchema.index(
  { matchId: 1, playerId: 1 },
  { unique: true, name: "unique_match_player_participant" }
);

export const MatchParticipantModel: Model<IMatchParticipant> =
  (mongoose.models.MatchParticipant as Model<IMatchParticipant>) ||
  mongoose.model<IMatchParticipant>("MatchParticipant", matchParticipantSchema);
