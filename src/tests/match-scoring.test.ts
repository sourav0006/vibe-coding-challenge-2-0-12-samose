import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createMatchSchema,
  updateMatchSchema,
  matchQuerySchema,
  addMatchParticipantSchema,
  batchUpdateParticipantsSchema,
} from "../lib/validation";
import { isRoleAuthorized } from "../lib/auth";
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

export async function runMatchScoringTestSuite() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 7 Match Management & Scoring Test Suite");
  console.log("=======================================================\n");

  const dummySportId = new mongoose.Types.ObjectId().toString();
  const otherSportId = new mongoose.Types.ObjectId().toString();
  const dummyPlayerId = new mongoose.Types.ObjectId().toString();

  // --- 1. Match Creation & Validation Tests ---
  console.log("--- 1. Match Creation & Validation Tests ---");

  await test("Valid match creation schema passes validation", () => {
    const input = {
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Arsenal Youth Academy",
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.status, "draft");
      assert.equal(result.data.opponentName, "Arsenal Youth Academy");
    }
  });

  await test("Invalid dates are rejected", () => {
    const invalidInputs = [
      { sportId: dummySportId, matchDate: "not-a-date", opponentName: "Team A" },
      { sportId: dummySportId, matchDate: "", opponentName: "Team A" },
      { sportId: dummySportId, matchDate: "2026/11/15", opponentName: "Team A" },
    ];
    for (const input of invalidInputs) {
      const result = createMatchSchema.safeParse(input);
      assert.equal(result.success, false, `Expected failure for date: ${input.matchDate}`);
    }
  });

  await test("Empty or whitespace-only opponent name is rejected", () => {
    const invalidInputs = [
      { sportId: dummySportId, matchDate: "2026-11-15", opponentName: "" },
      { sportId: dummySportId, matchDate: "2026-11-15", opponentName: "   " },
      { sportId: dummySportId, matchDate: "2026-11-15", opponentName: "A" }, // < 2 chars
    ];
    for (const input of invalidInputs) {
      const result = createMatchSchema.safeParse(input);
      assert.equal(result.success, false);
    }
  });

  await test("Opponent name exceeding 100 characters is rejected", () => {
    const input = {
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "A".repeat(101),
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  await test("Invalid Sport ObjectId format is rejected", () => {
    const input = {
      sportId: "invalid-sport-id-string",
      matchDate: "2026-11-15",
      opponentName: "Valid Opponent",
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  await test("Role Authorization: Coach can create/manage matches, Player and Scout cannot", () => {
    assert.equal(isRoleAuthorized("coach", ["coach"]), true);
    assert.equal(isRoleAuthorized("player", ["coach"]), false);
    assert.equal(isRoleAuthorized("scout", ["coach"]), false);
  });

  // --- 2. Player Eligibility & Sport History Tests ---
  console.log("\n--- 2. Player Eligibility & Sport History Tests ---");

  await test("Player assigned to matching sport on match date is eligible", () => {
    const player = {
      _id: new mongoose.Types.ObjectId(),
      sportId: new mongoose.Types.ObjectId(dummySportId),
      isActive: true,
      sportHistory: [
        {
          sportId: new mongoose.Types.ObjectId(dummySportId),
          effectiveFrom: new Date("2026-01-01"),
          effectiveTo: null,
        },
      ],
    } as unknown as IPlayer;

    const isEligible = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-11-15")
    );
    assert.equal(isEligible, true);
  });

  await test("Player assigned to different sport is NOT eligible", () => {
    const player = {
      _id: new mongoose.Types.ObjectId(),
      sportId: new mongoose.Types.ObjectId(otherSportId),
      isActive: true,
      sportHistory: [
        {
          sportId: new mongoose.Types.ObjectId(otherSportId),
          effectiveFrom: new Date("2026-01-01"),
          effectiveTo: null,
        },
      ],
    } as unknown as IPlayer;

    const isEligible = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-11-15")
    );
    assert.equal(isEligible, false);
  });

  await test("Historical sport assignment is strictly respected across date ranges", () => {
    // Player was in dummySportId until May 31, then transferred to otherSportId from June 1
    const player = {
      _id: new mongoose.Types.ObjectId(),
      sportId: new mongoose.Types.ObjectId(otherSportId),
      isActive: true,
      sportHistory: [
        {
          sportId: new mongoose.Types.ObjectId(dummySportId),
          effectiveFrom: new Date("2026-01-01"),
          effectiveTo: new Date("2026-05-31"),
        },
        {
          sportId: new mongoose.Types.ObjectId(otherSportId),
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: null,
        },
      ],
    } as unknown as IPlayer;

    // On April 10 (historical), player was in dummySportId
    const eligiblePast = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-04-10")
    );
    assert.equal(eligiblePast, true);

    // On October 10 (current), player is NO longer in dummySportId
    const eligiblePresent = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-10-10")
    );
    assert.equal(eligiblePresent, false);
  });

  // --- 3. Individual Participation & Scoring Validation Tests ---
  console.log("\n--- 3. Individual Participation & Scoring Validation Tests ---");

  await test("Score range: 0 is valid", () => {
    const input = { playerId: dummyPlayerId, score: 0 };
    const result = addMatchParticipantSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.score, 0);
    }
  });

  await test("Score range: 10 is valid", () => {
    const input = { playerId: dummyPlayerId, score: 10 };
    const result = addMatchParticipantSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.score, 10);
    }
  });

  await test("Score range: Decimals (e.g. 8.5) are valid", () => {
    const input = { playerId: dummyPlayerId, score: 8.5 };
    const result = addMatchParticipantSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.score, 8.5);
    }
  });

  await test("Negative scores are strictly rejected", () => {
    const invalidInputs = [
      { playerId: dummyPlayerId, score: -0.1 },
      { playerId: dummyPlayerId, score: -5 },
      { playerId: dummyPlayerId, score: -10 },
    ];
    for (const input of invalidInputs) {
      const result = addMatchParticipantSchema.safeParse(input);
      assert.equal(result.success, false, `Expected failure for score: ${input.score}`);
    }
  });

  await test("Scores greater than 10 are strictly rejected", () => {
    const invalidInputs = [
      { playerId: dummyPlayerId, score: 10.1 },
      { playerId: dummyPlayerId, score: 11 },
      { playerId: dummyPlayerId, score: 100 },
    ];
    for (const input of invalidInputs) {
      const result = addMatchParticipantSchema.safeParse(input);
      assert.equal(result.success, false, `Expected failure for score: ${input.score}`);
    }
  });

  await test("Invalid numeric types and missing scores are rejected", () => {
    const invalidInputs = [
      { playerId: dummyPlayerId, score: "ten" },
      { playerId: dummyPlayerId, score: null },
      { playerId: dummyPlayerId },
      { playerId: dummyPlayerId, score: NaN },
    ];
    for (const input of invalidInputs) {
      const result = addMatchParticipantSchema.safeParse(input);
      assert.equal(result.success, false);
    }
  });

  await test("Batch participants update schema validates all entries", () => {
    const validBatch = {
      participants: [
        { playerId: dummyPlayerId, score: 7.5 },
        { playerId: new mongoose.Types.ObjectId().toString(), score: 9.0 },
      ],
    };
    const result = batchUpdateParticipantsSchema.safeParse(validBatch);
    assert.equal(result.success, true);

    const invalidBatch = {
      participants: [
        { playerId: dummyPlayerId, score: 7.5 },
        { playerId: "invalid-id", score: 9.0 },
      ],
    };
    const invalidResult = batchUpdateParticipantsSchema.safeParse(invalidBatch);
    assert.equal(invalidResult.success, false);
  });

  // --- 4. Match Lifecycle & Finalization Invariants ---
  console.log("\n--- 4. Match Lifecycle & Finalization Invariants ---");

  await test("Match status enum supports only 'draft' and 'finalized'", () => {
    const validDraft = createMatchSchema.safeParse({
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Team B",
      status: "draft",
    });
    assert.equal(validDraft.success, true);

    const validFinalized = createMatchSchema.safeParse({
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Team B",
      status: "finalized",
    });
    assert.equal(validFinalized.success, true);

    const invalidStatus = createMatchSchema.safeParse({
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Team B",
      status: "completed", // invalid status
    });
    assert.equal(invalidStatus.success, false);
  });

  await test("updateMatchSchema allows valid partial match updates", () => {
    const validUpdate = updateMatchSchema.safeParse({
      opponentName: "Updated Opponent FC",
      matchDate: "2026-11-25",
    });
    assert.equal(validUpdate.success, true);
    if (validUpdate.success) {
      assert.equal(validUpdate.data.opponentName, "Updated Opponent FC");
    }

    const invalidUpdate = updateMatchSchema.safeParse({
      opponentName: "A", // too short
    });
    assert.equal(invalidUpdate.success, false);
  });

  await test("Match query parameters schema supports filters and pagination", () => {
    const query = {
      sportId: dummySportId,
      status: "finalized",
      search: "Chelsea",
      page: "2",
      limit: "10",
    };
    const parsed = matchQuerySchema.safeParse(query);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.page, 2);
      assert.equal(parsed.data.limit, 10);
      assert.equal(parsed.data.status, "finalized");
      assert.equal(parsed.data.search, "Chelsea");
    }
  });

  // --- Summary ---
  console.log("\n=========================================");
  console.log(`Phase 7 Test Suite Completed`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log("=========================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("match-scoring.test.ts")) {
  runMatchScoringTestSuite();
}
