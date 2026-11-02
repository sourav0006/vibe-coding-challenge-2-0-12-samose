import { z } from "zod";
import { objectIdSchema, dateInputSchema } from "./common.schema";

export const attendanceStatusSchema = z.enum(["present", "absent"], {
  message: "Attendance status must be either 'present' or 'absent'",
});

export const markAttendanceSchema = z.object({
  sessionId: objectIdSchema,
  playerId: objectIdSchema,
  status: attendanceStatusSchema,
  markedAt: dateInputSchema.optional(),
});

export const updateAttendanceSchema = z.object({
  status: attendanceStatusSchema,
  markedAt: dateInputSchema.optional(),
});

export const updateSessionAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        playerId: objectIdSchema,
        status: attendanceStatusSchema,
      })
    )
    .min(1, "At least one attendance record must be provided"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type UpdateSessionAttendanceInput = z.infer<typeof updateSessionAttendanceSchema>;
