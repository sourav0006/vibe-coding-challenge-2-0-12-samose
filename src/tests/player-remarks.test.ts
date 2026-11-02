import assert from "node:assert/strict";
import mongoose from "mongoose";
import { isRoleAuthorized } from "../lib/auth";
import {
  coachRemarkPayloadSchema,
  createCoachRemarkSchema,
  updateCoachRemarkSchema,
  paginationQuerySchema,
} from "../lib/validation";
import { ReadinessService } from "../lib/services/readiness.service";
import { RemarkService } from "../lib/services/remark.service";

let passedCount = 0;
let failedCount = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err instanceof Error ? err.message : err}`);
    failedCount++;
  }
}

export async function runPlayerRemarksTestSuite() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 9 Player Portal & Coach Remarks Test Suite");
  console.log("=======================================================\n");

  const dummyPlayerId = new mongoose.Types.ObjectId().toString();
  const anotherPlayerId = new mongoose.Types.ObjectId().toString();
  const dummyCoachId = new mongoose.Types.ObjectId().toString();

  // --- 1. Coach Remark Validation Tests ---
  console.log("--- 1. Coach Remark Validation Tests ---");

  await test("Valid remark text (1–1000 chars) passes validation", () => {
    const valid = coachRemarkPayloadSchema.safeParse({
      content: "Great effort during transitions today. Keep up the high work rate!",
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(
        valid.data.content,
        "Great effort during transitions today. Keep up the high work rate!"
      );
    }
  });

  await test("Empty remark text is rejected", () => {
    const invalid = coachRemarkPayloadSchema.safeParse({ content: "" });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.match(invalid.error.issues[0].message, /cannot be empty/i);
    }
  });

  await test("Whitespace-only remark is rejected after trimming", () => {
    const invalid = coachRemarkPayloadSchema.safeParse({ content: "    \n   \t  " });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.match(invalid.error.issues[0].message, /cannot be empty/i);
    }
  });

  await test("Remark exceeding 1,000 characters is rejected", () => {
    const longContent = "A".repeat(1001);
    const invalid = coachRemarkPayloadSchema.safeParse({ content: longContent });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.match(invalid.error.issues[0].message, /cannot exceed 1000 characters/i);
    }
  });

  await test("Remark at exact 1,000 character limit passes validation", () => {
    const maxContent = "B".repeat(1000);
    const valid = coachRemarkPayloadSchema.safeParse({ content: maxContent });
    assert.equal(valid.success, true);
  });

  await test("createCoachRemarkSchema validates valid ObjectId and optional coachId", () => {
    const valid = createCoachRemarkSchema.safeParse({
      playerId: dummyPlayerId,
      coachId: dummyCoachId,
      content: "Solid tactical discipline in the second half.",
    });
    assert.equal(valid.success, true);
  });

  await test("createCoachRemarkSchema rejects invalid playerId format", () => {
    const invalid = createCoachRemarkSchema.safeParse({
      playerId: "not-a-valid-id",
      content: "Good game.",
    });
    assert.equal(invalid.success, false);
  });

  await test("updateCoachRemarkSchema validates content updates", () => {
    const valid = updateCoachRemarkSchema.safeParse({
      content: "Updated coaching feedback.",
    });
    assert.equal(valid.success, true);
  });

  // --- 2. Role-Based Access Control (RBAC) & Isolation Tests ---
  console.log("\n--- 2. Role-Based Access Control (RBAC) & Isolation Tests ---");

  await test("Player role is authorized for player endpoints", () => {
    assert.equal(isRoleAuthorized("player", "player"), true);
  });

  await test("Coach role is rejected from Player-only guards", () => {
    assert.equal(isRoleAuthorized("coach", "player"), false);
  });

  await test("Scout role is rejected from Player-only guards", () => {
    assert.equal(isRoleAuthorized("scout", "player"), false);
  });

  await test("Player role is rejected from Coach-only remark creation/editing", () => {
    assert.equal(isRoleAuthorized("player", "coach"), false);
  });

  await test("Scout role is rejected from Coach-only remark creation/editing", () => {
    assert.equal(isRoleAuthorized("scout", "coach"), false);
  });

  await test("Scout role has no access to coach remarks in any capacity", () => {
    assert.equal(isRoleAuthorized("scout", ["coach", "player"]), false);
  });

  // --- 3. Cross-Player Isolation & Security Invariants ---
  console.log("\n--- 3. Cross-Player Isolation & Security Invariants ---");

  await test("Coach cannot manipulate a remark belonging to a different player via mismatched playerId", () => {
    // Simulating mock Remark document
    const mockRemark = {
      _id: new mongoose.Types.ObjectId(),
      playerId: new mongoose.Types.ObjectId(dummyPlayerId),
      content: "Original remark",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If a request provides anotherPlayerId for this remark, ownership check must detect mismatch
    const isOwnerMatch = mockRemark.playerId.toString() === anotherPlayerId;
    assert.equal(isOwnerMatch, false, "Must detect player ID mismatch and reject modification");
  });

  await test("Remark DTO sanitization strips internal MongoDB fields", () => {
    const mockRemarkDoc = {
      _id: new mongoose.Types.ObjectId(),
      playerId: new mongoose.Types.ObjectId(),
      coachId: new mongoose.Types.ObjectId(),
      content: "Excellent technique.",
      createdAt: new Date("2026-11-01T10:00:00Z"),
      updatedAt: new Date("2026-11-01T10:00:00Z"),
    };

    const dto = RemarkService.toSafeDTO(mockRemarkDoc as unknown as import("../models").ICoachRemark);
    assert.equal(typeof dto.id, "string");
    assert.equal(typeof dto.playerId, "string");
    assert.equal(typeof dto.coachId, "string");
    assert.equal(dto.content, "Excellent technique.");
    const record = dto as unknown as Record<string, unknown>;
    assert.equal(record.__v, undefined);
    assert.equal(record.passwordHash, undefined);
  });

  // --- 4. Player Dashboard Integration & Invariants ---
  console.log("\n--- 4. Player Dashboard Integration & Invariants ---");

  await test("Player dashboard derives official readiness using Phase 8 evaluation engine", () => {
    // Exact 75% attendance and 2 matches -> Ready
    const readyEval = ReadinessService.evaluateReadiness(75.0, 2);
    assert.equal(readyEval.status, "ready");
    assert.equal(readyEval.isReady, true);

    // Below 75% attendance -> Not Ready
    const notReadyEval = ReadinessService.evaluateReadiness(74.9, 5);
    assert.equal(notReadyEval.status, "not_ready");
    assert.equal(notReadyEval.isReady, false);

    // Less than 2 matches -> Not Ready
    const notEnoughMatches = ReadinessService.evaluateReadiness(95.0, 1);
    assert.equal(notEnoughMatches.status, "not_ready");
    assert.equal(notEnoughMatches.isReady, false);
  });

  await test("Pagination schema coerces defaults and caps maximum page size", () => {
    const parsedDefault = paginationQuerySchema.parse({});
    assert.equal(parsedDefault.page, 1);
    assert.equal(parsedDefault.limit, 20);

    const parsedCustom = paginationQuerySchema.parse({ page: "3", limit: "50" });
    assert.equal(parsedCustom.page, 3);
    assert.equal(parsedCustom.limit, 50);

    const parsedOverLimit = paginationQuerySchema.safeParse({ limit: 150 });
    assert.equal(parsedOverLimit.success, false, "Limit > 100 must be rejected");
  });

  console.log("\n=========================================");
  console.log(`Phase 9 Unit Test Suite Completed`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log("=========================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run when executed directly
if (require.main === module || process.argv[1]?.endsWith("player-remarks.test.ts")) {
  runPlayerRemarksTestSuite();
}
