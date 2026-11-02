import { connectToDatabase } from "@/lib/db";
import { CoachRemarkModel, PlayerModel, type ICoachRemark } from "@/models";
import type { CreateCoachRemarkInput, UpdateCoachRemarkInput } from "@/lib/validation";

export interface SafeCoachRemarkDTO {
  id: string;
  playerId: string;
  coachId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class RemarkService {
  /**
   * Serializes a CoachRemark document to a clean DTO
   */
  static toSafeDTO(remark: ICoachRemark): SafeCoachRemarkDTO {
    return {
      id: remark._id.toString(),
      playerId: remark.playerId.toString(),
      coachId: remark.coachId ? remark.coachId.toString() : undefined,
      content: remark.content,
      createdAt: remark.createdAt.toISOString(),
      updatedAt: remark.updatedAt.toISOString(),
    };
  }

  /**
   * Adds a new coach remark for a specific player
   */
  static async create(input: CreateCoachRemarkInput): Promise<ICoachRemark> {
    await connectToDatabase();

    const player = await PlayerModel.findById(input.playerId).exec();
    if (!player) {
      throw new Error("Validation Error: Referenced Player does not exist.");
    }

    const remark = new CoachRemarkModel({
      playerId: input.playerId,
      coachId: input.coachId || undefined,
      content: input.content.trim(),
    });

    return remark.save();
  }

  /**
   * Finds remarks for a player ordered chronologically (newest first)
   */
  static async findByPlayer(playerId: string, limit = 50): Promise<ICoachRemark[]> {
    await connectToDatabase();
    return CoachRemarkModel.find({ playerId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  /**
   * Finds a remark by ID
   */
  static async findById(id: string): Promise<ICoachRemark | null> {
    await connectToDatabase();
    return CoachRemarkModel.findById(id).exec();
  }

  /**
   * Updates an existing remark, strictly validating player ownership if playerId is supplied
   */
  static async update(
    id: string,
    inputOrPlayerId: UpdateCoachRemarkInput | string,
    maybeInput?: UpdateCoachRemarkInput
  ): Promise<ICoachRemark | null> {
    await connectToDatabase();

    let targetPlayerId: string | undefined;
    let input: UpdateCoachRemarkInput;

    if (typeof inputOrPlayerId === "string") {
      targetPlayerId = inputOrPlayerId;
      input = maybeInput!;
    } else {
      input = inputOrPlayerId;
    }

    const existing = await CoachRemarkModel.findById(id).exec();
    if (!existing) {
      return null;
    }

    // Verify player ownership to prevent cross-player remark manipulation
    if (targetPlayerId && existing.playerId.toString() !== targetPlayerId) {
      return null;
    }

    existing.content = input.content.trim();
    return existing.save();
  }

  /**
   * Deletes a remark, strictly validating player ownership if playerId is supplied
   */
  static async delete(id: string, playerId?: string): Promise<boolean> {
    await connectToDatabase();

    if (playerId) {
      const existing = await CoachRemarkModel.findById(id).exec();
      if (!existing || existing.playerId.toString() !== playerId) {
        return false;
      }
    }

    const result = await CoachRemarkModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }
}
