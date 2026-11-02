import assert from "node:assert/strict";
import mongoose from "mongoose";
import { ReadinessService } from "../lib/services/readiness.service";
import { isRoleAuthorized } from "../lib/auth";
import { readinessQuerySchema, scoutQuerySchema } from "../lib/validation";
import { AttendanceService } from "../lib/services/attendance.service";
import type { IPlayer } from "../models";

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

export async function runReadinessTestSuite() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 8 Readiness Engine & Scout Discovery Test Suite");
  console.log("=======================================================\n");

  const dummySportId = new mongoose.Types.ObjectId().toString();
  const otherSportId = new mongoose.Types.ObjectId().toString();

  // --- 1. Readiness Business Rule & Boundary Tests ---
  console.log("--- 1. Readiness Business Rule & Boundary Tests ---");

  await test("Condition 1: Attendance exactly 75.0% and 2 finalized matches -> READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(75.0, 2);
    assert.equal(evalResult.status, "ready");
    assert.equal(evalResult.isReady, true);
    assert.equal(evalResult.attendanceCriterionMet, true);
    assert.equal(evalResult.matchCriterionMet, true);
  });

  await test("Condition 2: Attendance above 75% (e.g. 85.0%) and 2 matches -> READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(85.0, 2);
    assert.equal(evalResult.status, "ready");
    assert.equal(evalResult.isReady, true);
    assert.equal(evalResult.attendanceCriterionMet, true);
    assert.equal(evalResult.matchCriterionMet, true);
  });

  await test("Condition 3: Attendance below 75% (e.g. 74.0%) and 2 matches -> NOT READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(74.0, 2);
    assert.equal(evalResult.status, "not_ready");
    assert.equal(evalResult.isReady, false);
    assert.equal(evalResult.attendanceCriterionMet, false);
    assert.equal(evalResult.matchCriterionMet, true);
  });

  await test("Condition 4: Attendance exactly 75.0% and 1 match -> NOT READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(75.0, 1);
    assert.equal(evalResult.status, "not_ready");
    assert.equal(evalResult.isReady, false);
    assert.equal(evalResult.attendanceCriterionMet, true);
    assert.equal(evalResult.matchCriterionMet, false);
  });

  await test("Condition 5: Attendance above 75% (e.g. 90.0%) and 0 matches -> NOT READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(90.0, 0);
    assert.equal(evalResult.status, "not_ready");
    assert.equal(evalResult.isReady, false);
    assert.equal(evalResult.attendanceCriterionMet, true);
    assert.equal(evalResult.matchCriterionMet, false);
  });

  await test("Condition 6: Attendance N/A (null) and 2 matches -> NOT READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(null, 2);
    assert.equal(evalResult.status, "not_ready");
    assert.equal(evalResult.isReady, false);
    assert.equal(evalResult.attendanceCriterionMet, false);
    assert.equal(evalResult.matchCriterionMet, true);
  });

  await test("Condition 7: Attendance 100% and 1 match -> NOT READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(100.0, 1);
    assert.equal(evalResult.status, "not_ready");
    assert.equal(evalResult.isReady, false);
    assert.equal(evalResult.attendanceCriterionMet, true);
    assert.equal(evalResult.matchCriterionMet, false);
  });

  await test("Condition 8: Attendance 74.9% (strict decimal boundary) and 10 matches -> NOT READY", () => {
    const evalResult = ReadinessService.evaluateReadiness(74.9, 10);
    assert.equal(evalResult.status, "not_ready");
    assert.equal(evalResult.isReady, false);
    assert.equal(evalResult.attendanceCriterionMet, false);
    assert.equal(evalResult.matchCriterionMet, true);
  });

  // --- 2. Historical Assignment & Roster Invariants ---
  console.log("\n--- 2. Historical Assignment & Roster Invariants ---");

  await test("Historical sport assignment determines session eligibility across dates", () => {
    const player = {
      _id: new mongoose.Types.ObjectId(),
      sportId: new mongoose.Types.ObjectId(dummySportId),
      isActive: true,
      sportHistory: [
        {
          sportId: new mongoose.Types.ObjectId(dummySportId),
          effectiveFrom: new Date("2026-01-01"),
          effectiveTo: new Date("2026-06-30"),
        },
        {
          sportId: new mongoose.Types.ObjectId(otherSportId),
          effectiveFrom: new Date("2026-07-01"),
          effectiveTo: null,
        },
      ],
    } as unknown as IPlayer;

    // Eligible for dummySportId in March 2026
    const eligiblePast = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-03-15")
    );
    assert.equal(eligiblePast, true);

    // Ineligible for dummySportId in August 2026
    const eligibleLater = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-08-15")
    );
    assert.equal(eligibleLater, false);
  });

  // --- 3. Role-Based Access Control & Isolation Tests ---
  console.log("\n--- 3. Role-Based Access Control & Isolation Tests ---");

  await test("Scout role authorized for scout discovery; Player and Coach rejected from scout-only guards", () => {
    assert.equal(isRoleAuthorized("scout", ["scout"]), true);
    assert.equal(isRoleAuthorized("player", ["scout"]), false);
    assert.equal(isRoleAuthorized("coach", ["scout"]), false);
  });

  await test("Coach role authorized for coach readiness; Player and Scout rejected from coach guards", () => {
    assert.equal(isRoleAuthorized("coach", ["coach"]), true);
    assert.equal(isRoleAuthorized("player", ["coach"]), false);
    assert.equal(isRoleAuthorized("scout", ["coach"]), false);
  });

  // --- 4. Zod Validation & Schema Tests ---
  console.log("\n--- 4. Query Schema Validation Tests ---");

  await test("Coach readiness query schema parses defaults and valid values", () => {
    const query = {
      sportId: dummySportId,
      status: "ready",
      sortBy: "attendance",
      sortOrder: "desc",
      page: "2",
      limit: "15",
    };
    const parsed = readinessQuerySchema.safeParse(query);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.status, "ready");
      assert.equal(parsed.data.sortBy, "attendance");
      assert.equal(parsed.data.sortOrder, "desc");
      assert.equal(parsed.data.page, 2);
      assert.equal(parsed.data.limit, 15);
    }
  });

  await test("Scout query schema parses search and sport filters", () => {
    const query = {
      sportId: dummySportId,
      search: "Leo",
      page: "1",
      limit: "20",
    };
    const parsed = scoutQuerySchema.safeParse(query);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.search, "Leo");
      assert.equal(parsed.data.page, 1);
      assert.equal(parsed.data.limit, 20);
    }
  });

  // --- Summary ---
  console.log("\n=========================================");
  console.log(`Phase 8 Unit Test Suite Completed`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log("=========================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("readiness.test.ts")) {
  runReadinessTestSuite();
}
