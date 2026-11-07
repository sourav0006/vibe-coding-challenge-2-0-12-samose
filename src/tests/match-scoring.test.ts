import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
  console.log("One Academy: Phase 7 Match Management & Title Scheduling Test Suite");
  console.log("=======================================================\n");

  const dummySportId = new mongoose.Types.ObjectId().toString();
  const otherSportId = new mongoose.Types.ObjectId().toString();
  const dummyPlayerId = new mongoose.Types.ObjectId().toString();

  // --- 1. Match Creation & Title Validation Tests ---
  console.log("--- 1. Match Creation & Title Validation Tests ---");

  await test("Valid match creation schema with title passes validation", () => {
    const input = {
      title: "Dumka Series M1",
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Arsenal Youth Academy",
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, "Dumka Series M1");
      assert.equal(result.data.status, "draft");
      assert.equal(result.data.opponentName, "Arsenal Youth Academy");
    }
  });

  await test("Empty or whitespace-only match title is rejected", () => {
    const invalidInputs = [
      { title: "", sportId: dummySportId, matchDate: "2026-11-15", opponentName: "Team A" },
      { title: "   ", sportId: dummySportId, matchDate: "2026-11-15", opponentName: "Team A" },
      { title: "T", sportId: dummySportId, matchDate: "2026-11-15", opponentName: "Team A" }, // < 2 chars
    ];
    for (const input of invalidInputs) {
      const result = createMatchSchema.safeParse(input);
      assert.equal(result.success, false, `Expected failure for title: "${input.title}"`);
    }
  });

  await test("Match title exceeding 100 characters is rejected", () => {
    const input = {
      title: "M".repeat(101),
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Valid Opponent",
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  await test("Match title and opponent name whitespace are automatically trimmed", () => {
    const input = {
      title: "   Inter Academy Final   ",
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "   Dumka Academy   ",
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, "Inter Academy Final");
      assert.equal(result.data.opponentName, "Dumka Academy");
    }
  });

  await test("Invalid dates are rejected", () => {
    const invalidInputs = [
      { title: "Test Match 1", sportId: dummySportId, matchDate: "not-a-date", opponentName: "Team A" },
      { title: "Test Match 1", sportId: dummySportId, matchDate: "", opponentName: "Team A" },
      { title: "Test Match 1", sportId: dummySportId, matchDate: "2026/11/15", opponentName: "Team A" },
    ];
    for (const input of invalidInputs) {
      const result = createMatchSchema.safeParse(input);
      assert.equal(result.success, false, `Expected failure for date: ${input.matchDate}`);
    }
  });

  await test("Empty or whitespace-only opponent name is rejected", () => {
    const invalidInputs = [
      { title: "Test Match 1", sportId: dummySportId, matchDate: "2026-11-15", opponentName: "" },
      { title: "Test Match 1", sportId: dummySportId, matchDate: "2026-11-15", opponentName: "   " },
      { title: "Test Match 1", sportId: dummySportId, matchDate: "2026-11-15", opponentName: "A" }, // < 2 chars
    ];
    for (const input of invalidInputs) {
      const result = createMatchSchema.safeParse(input);
      assert.equal(result.success, false);
    }
  });

  await test("Opponent name exceeding 100 characters is rejected", () => {
    const input = {
      title: "Test Match 1",
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "A".repeat(101),
    };
    const result = createMatchSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  await test("Invalid Sport ObjectId format is rejected", () => {
    const input = {
      title: "Test Match 1",
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

  // --- 2. Same-Day Match Scheduling & Compound Uniqueness Logic ---
  console.log("\n--- 2. Same-Day Match Scheduling & Compound Uniqueness Logic ---");

  // In-memory mock store implementing compound key uniqueness:
  // key = `${sportId}::${matchDate}::${normalizedOpponent}::${normalizedTitle}`
  const mockMatchStore: Array<{
    sportId: string;
    matchDate: string;
    opponentName: string;
    normalizedOpponent: string;
    title: string;
    normalizedTitle: string;
  }> = [];

  function simulateCreateMatch(input: {
    sportId: string;
    matchDate: string;
    opponentName: string;
    title: string;
  }) {
    const normOpp = input.opponentName.trim().toLowerCase();
    const normTitle = input.title.trim().toLowerCase();

    const duplicate = mockMatchStore.find(
      (m) =>
        m.sportId === input.sportId &&
        m.matchDate === input.matchDate &&
        m.normalizedOpponent === normOpp &&
        m.normalizedTitle === normTitle
    );

    if (duplicate) {
      throw new Error(
        "Conflict: A match with this title already exists against this opponent in this sport on the selected date. Please use a different match title."
      );
    }

    const record = {
      sportId: input.sportId,
      matchDate: input.matchDate,
      opponentName: input.opponentName.trim(),
      normalizedOpponent: normOpp,
      title: input.title.trim(),
      normalizedTitle: normTitle,
    };
    mockMatchStore.push(record);
    return record;
  }

  await test("Scenario 1: First match against opponent in sport on date succeeds", () => {
    const record = simulateCreateMatch({
      sportId: dummySportId,
      matchDate: "2026-11-06",
      opponentName: "Dumka Academy",
      title: "Test Match 1",
    });
    assert.equal(record.title, "Test Match 1");
    assert.equal(record.normalizedTitle, "test match 1");
  });

  await test("Scenario 2: Second match with different title against same opponent on same date succeeds", () => {
    const record = simulateCreateMatch({
      sportId: dummySportId,
      matchDate: "2026-11-06",
      opponentName: "Dumka Academy",
      title: "Dumka Series M2",
    });
    assert.equal(record.title, "Dumka Series M2");
    assert.equal(record.normalizedTitle, "dumka series m2");
  });

  await test("Scenario 3: Multiple matches (3+) scheduled on the same date succeed without restriction", () => {
    const m3 = simulateCreateMatch({
      sportId: dummySportId,
      matchDate: "2026-11-06",
      opponentName: "Dumka Academy",
      title: "Dumka Series M3",
    });
    const m4 = simulateCreateMatch({
      sportId: dummySportId,
      matchDate: "2026-11-06",
      opponentName: "Dumka Academy",
      title: "Inter Academy Final",
    });
    assert.ok(m3);
    assert.ok(m4);
  });

  await test("Scenario 4: Duplicate match combination (same sport, date, opponent, title) is rejected with exact 409 conflict message", () => {
    assert.throws(
      () =>
        simulateCreateMatch({
          sportId: dummySportId,
          matchDate: "2026-11-06",
          opponentName: "Dumka Academy",
          title: "Test Match 1",
        }),
      (err: Error) => {
        return (
          err.message ===
          "Conflict: A match with this title already exists against this opponent in this sport on the selected date. Please use a different match title."
        );
      }
    );
  });

  await test("Scenario 5: Case-insensitive duplicate detection ('Test Match 1' vs 'test match 1') is rejected", () => {
    assert.throws(
      () =>
        simulateCreateMatch({
          sportId: dummySportId,
          matchDate: "2026-11-06",
          opponentName: "dumka academy",
          title: "test match 1",
        }),
      (err: Error) => {
        return err.message.includes(
          "A match with this title already exists against this opponent in this sport on the selected date. Please use a different match title."
        );
      }
    );
  });

  await test("Scenario 7: Same match title against a DIFFERENT opponent on same date is allowed", () => {
    const record = simulateCreateMatch({
      sportId: dummySportId,
      matchDate: "2026-11-06",
      opponentName: "Manchester Academy",
      title: "Test Match 1",
    });
    assert.equal(record.opponentName, "Manchester Academy");
    assert.equal(record.title, "Test Match 1");
  });

  await test("Scenario 8: Same match title for a DIFFERENT sport on same date is allowed", () => {
    const record = simulateCreateMatch({
      sportId: otherSportId,
      matchDate: "2026-11-06",
      opponentName: "Dumka Academy",
      title: "Test Match 1",
    });
    assert.equal(record.sportId, otherSportId);
    assert.equal(record.title, "Test Match 1");
  });

  await test("Scenario 9: Same match title against same opponent on a DIFFERENT date is allowed", () => {
    const record = simulateCreateMatch({
      sportId: dummySportId,
      matchDate: "2026-11-07",
      opponentName: "Dumka Academy",
      title: "Test Match 1",
    });
    assert.equal(record.matchDate, "2026-11-07");
    assert.equal(record.title, "Test Match 1");
  });

  // --- 3. UI Form Field Order Invariants ---
  console.log("\n--- 3. UI Form Field Order Invariants ---");

  await test("Match Creation page displays fields in strict order: Title, Opponent, Sport, Date", () => {
    const formFilePath = path.join(
      process.cwd(),
      "src/features/matches/create-match-form.tsx"
    );
    const formContent = fs.readFileSync(formFilePath, "utf-8");

    const titleIndex = formContent.indexOf("id=\"match-title\"");
    const opponentIndex = formContent.indexOf("id=\"match-opponent\"");
    const sportIndex = formContent.indexOf("id=\"match-sport\"");
    const dateIndex = formContent.indexOf("id=\"match-date\"");

    assert.ok(titleIndex > 0, "match-title field must exist");
    assert.ok(opponentIndex > 0, "match-opponent field must exist");
    assert.ok(sportIndex > 0, "match-sport field must exist");
    assert.ok(dateIndex > 0, "match-date field must exist");

    assert.ok(
      titleIndex < opponentIndex,
      "Field 1 (Match Title) must appear before Field 2 (Opponent)"
    );
    assert.ok(
      opponentIndex < sportIndex,
      "Field 2 (Opponent) must appear before Field 3 (Sport)"
    );
    assert.ok(
      sportIndex < dateIndex,
      "Field 3 (Sport) must appear before Field 4 (Match Date)"
    );
  });

  // --- 4. Player Eligibility & Sport History Tests ---
  console.log("\n--- 4. Player Eligibility & Sport History Tests ---");

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

    const eligiblePast = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-04-10")
    );
    assert.equal(eligiblePast, true);

    const eligiblePresent = AttendanceService.isPlayerEligibleForSession(
      player,
      dummySportId,
      new Date("2026-10-10")
    );
    assert.equal(eligiblePresent, false);
  });

  // --- 5. Individual Participation & Scoring Validation Tests ---
  console.log("\n--- 5. Individual Participation & Scoring Validation Tests ---");

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

  // --- 6. Match Lifecycle & Finalization Invariants ---
  console.log("\n--- 6. Match Lifecycle & Finalization Invariants ---");

  await test("Match status enum supports only 'draft' and 'finalized'", () => {
    const validDraft = createMatchSchema.safeParse({
      title: "Draft Game",
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Team B",
      status: "draft",
    });
    assert.equal(validDraft.success, true);

    const validFinalized = createMatchSchema.safeParse({
      title: "Finalized Game",
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Team B",
      status: "finalized",
    });
    assert.equal(validFinalized.success, true);

    const invalidStatus = createMatchSchema.safeParse({
      title: "Completed Game",
      sportId: dummySportId,
      matchDate: "2026-11-15",
      opponentName: "Team B",
      status: "completed", // invalid status
    });
    assert.equal(invalidStatus.success, false);
  });

  await test("updateMatchSchema allows valid partial match updates including title", () => {
    const validUpdate = updateMatchSchema.safeParse({
      title: "Updated Title FC",
      opponentName: "Updated Opponent FC",
      matchDate: "2026-11-25",
    });
    assert.equal(validUpdate.success, true);
    if (validUpdate.success) {
      assert.equal(validUpdate.data.title, "Updated Title FC");
      assert.equal(validUpdate.data.opponentName, "Updated Opponent FC");
    }

    const invalidUpdate = updateMatchSchema.safeParse({
      title: "A", // too short
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
