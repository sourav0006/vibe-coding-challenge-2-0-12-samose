import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const matchParticipantScoreSchema = z
  .number({ message: "Score must be a valid number" })
  .min(0, { message: "Score cannot be less than 0" })
  .max(10, { message: "Score cannot exceed 10" });

export const addMatchParticipantSchema = z.object({
  matchId: objectIdSchema.optional(),
  playerId: objectIdSchema,
  score: matchParticipantScoreSchema,
});

export const updateMatchParticipantSchema = z.object({
  score: matchParticipantScoreSchema,
});

export const batchUpdateParticipantsSchema = z.object({
  participants: z
    .array(
      z.object({
        playerId: objectIdSchema,
        score: matchParticipantScoreSchema,
      })
    )
    .min(1, { message: "At least one participant must be provided" }),
});

export type AddMatchParticipantInput = z.infer<typeof addMatchParticipantSchema>;
export type UpdateMatchParticipantInput = z.infer<typeof updateMatchParticipantSchema>;
export type BatchUpdateParticipantsInput = z.infer<typeof batchUpdateParticipantsSchema>;
