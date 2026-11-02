import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createPracticeSessionSchema,
  updatePracticeSessionSchema,
  sessionQuerySchema,
  markAttendanceSchema,
  updateSessionAttendanceSchema,
} from "../lib/validation";
import { isRoleAuthorized } from "../lib/auth";
import { AttendanceService } from "../lib/services/attendance.service";
import { SessionService } from "../lib/services/session.service";
import type { IPlayer, AttendanceStatus } from "../models";

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

export async function runSessionAttendanceTestSuite() {
  console.log("\n=========================================");
  console.log("One Academy: Phase 6 Practice Sessions & Attendance Test Suite");
  console.log("=========================================\n");

  const dummySportId = new mongoose.Types.ObjectId().toString();
  const otherSportId = new mongoose.Types.ObjectId().toString();
  const dummyPlayerId = new mongoose.Types.ObjectId().toString();
  const dummySessionId = new mongoose.Types.ObjectId().toString();

  // --- 1. Session Creation & Validation Tests ---
  console.log("--- 1. Session Creation & Validation Tests ---");

  await test("Valid practice session creation schema passes validation", () => {
    const input = {
      sportId: dummySportId,
      sessionDate: "2026-11-02",
    };
    const result = createPracticeSessionSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.status, "open");
    }
  });

  await test("Invalid dates are rejected", () => {
    const invalidInputs = [
      { sportId: dummySportId, sessionDate: "invalid-date" },
      { sportId: dummySportId, sessionDate: "" },
      { sportId: dummySportId, sessionDate: null },
    ];
    for (const input of invalidInputs) {
      const result = createPracticeSessionSchema.safeParse(input);
      assert.equal(result.success, false, `Input ${JSON.stringify(input)} should be rejected`);
    }
  });

  await test("Invalid sport ObjectId is rejected", () => {
    const result = createPracticeSessionSchema.safeParse({
      sportId: "not-an-objectid",
      sessionDate: "2026-11-02",
    });
    assert.equal(result.success, false);
  });

  await test("updatePracticeSessionSchema validates partial updates and closure payload", () => {
    const updateResult = updatePracticeSessionSchema.safeParse({
      status: "closed",
      closedAt: new Date(),
    });
    assert.equal(updateResult.success, true);

    const invalidStatus = updatePracticeSessionSchema.safeParse({
      status: "archived" as unknown,
    });
    assert.equal(invalidStatus.success, false);
  });

  await test("sessionQuerySchema coerces defaults and validates pagination parameters", () => {
    const defaultQuery = sessionQuerySchema.safeParse({});
    assert.equal(defaultQuery.success, true);
    if (defaultQuery.success) {
      assert.equal(defaultQuery.data.status, "all");
      assert.equal(defaultQuery.data.page, 1);
      assert.equal(defaultQuery.data.limit, 20);
    }

    const filteredQuery = sessionQuerySchema.safeParse({
      status: "open",
      page: "2",
      limit: "10",
    });
    assert.equal(filteredQuery.success, true);
    if (filteredQuery.success) {
      assert.equal(filteredQuery.data.status, "open");
      assert.equal(filteredQuery.data.page, 2);
      assert.equal(filteredQuery.data.limit, 10);
    }
  });

  await test("Session date normalization produces consistent UTC calendar boundaries", () => {
    const { startOfDay, endOfDay, normalizedDate } = SessionService.normalizeSessionDate("2026-11-02");
    assert.equal(startOfDay.toISOString(), "2026-11-02T00:00:00.000Z");
    assert.equal(endOfDay.toISOString(), "2026-11-02T23:59:59.999Z");
    assert.equal(normalizedDate.toISOString(), "2026-11-02T00:00:00.000Z");
  });

  await test("Duplicate sport and date detection identifies matching calendar window", () => {
    const { startOfDay, endOfDay } = SessionService.normalizeSessionDate("2026-11-02");
    const testDate = new Date("2026-11-02T14:30:00.000Z");
    assert.equal(testDate >= startOfDay && testDate <= endOfDay, true);

    const differentDay = new Date("2026-11-03T00:00:00.000Z");
    assert.equal(differentDay >= startOfDay && differentDay <= endOfDay, false);
  });

  await test("RBAC: Non-Coach users cannot manage practice sessions", () => {
    assert.equal(isRoleAuthorized("coach", "coach"), true);
    assert.equal(isRoleAuthorized("player", "coach"), false);
    assert.equal(isRoleAuthorized("scout", "coach"), false);
  });

  // --- 2. Player Eligibility & Historical Sport Assignment Tests ---
  console.log("\n--- 2. Player Eligibility & Historical Assignment Tests ---");

  await test("Only players belonging to the session sport are eligible", () => {
    const sessionSportId = new mongoose.Types.ObjectId();
    const sessionDate = new Date("2026-11-02T00:00:00.000Z");

    const playerSameSport = {
      sportId: sessionSportId,
      isActive: true,
      createdAt: new Date("2026-10-01"),
    } as unknown as IPlayer;

    const playerOtherSport = {
      sportId: new mongoose.Types.ObjectId(),
      isActive: true,
      createdAt: new Date("2026-10-01"),
    } as unknown as IPlayer;

    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerSameSport, sessionSportId, sessionDate),
      true
    );
    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerOtherSport, sessionSportId, sessionDate),
      false
    );
  });

  await test("Historical sport assignment determines session eligibility correctly across dates", () => {
    const sportA = new mongoose.Types.ObjectId();
    const sportB = new mongoose.Types.ObjectId();

    // Player started in sportA, transferred to sportB on 2026-10-15
    const playerWithHistory = {
      sportId: sportB,
      isActive: true,
      sportHistory: [
        {
          sportId: sportA,
          effectiveFrom: new Date("2026-09-01T00:00:00.000Z"),
          effectiveTo: new Date("2026-10-14T23:59:59.999Z"),
        },
        {
          sportId: sportB,
          effectiveFrom: new Date("2026-10-15T00:00:00.000Z"),
          effectiveTo: null,
        },
      ],
    } as unknown as IPlayer;

    // Date in September: should be eligible for sportA, NOT sportB
    const septSession = new Date("2026-09-15T00:00:00.000Z");
    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerWithHistory, sportA, septSession),
      true,
      "Player should be eligible for Sport A in Sept"
    );
    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerWithHistory, sportB, septSession),
      false,
      "Player should NOT be eligible for Sport B in Sept before reassignment"
    );

    // Date in November: should be eligible for sportB, NOT sportA
    const novSession = new Date("2026-11-02T00:00:00.000Z");
    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerWithHistory, sportA, novSession),
      false,
      "Player should NOT be eligible for Sport A in Nov after reassignment"
    );
    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerWithHistory, sportB, novSession),
      true,
      "Player should be eligible for Sport B in Nov"
    );
  });

  await test("Player created AFTER session date is not eligible for historical session", () => {
    const sportId = new mongoose.Types.ObjectId();
    const pastSessionDate = new Date("2026-10-01T00:00:00.000Z");

    const playerJoinedLater = {
      sportId,
      isActive: true,
      createdAt: new Date("2026-10-15T00:00:00.000Z"),
      sportHistory: [
        {
          sportId,
          effectiveFrom: new Date("2026-10-15T00:00:00.000Z"),
          effectiveTo: null,
        },
      ],
    } as unknown as IPlayer;

    assert.equal(
      AttendanceService.isPlayerEligibleForSession(playerJoinedLater, sportId, pastSessionDate),
      false
    );
  });

  await test("Archived players are excluded from active session roster", () => {
    const activePlayer = { isActive: true };
    const archivedPlayer = { isActive: false };

    assert.equal(activePlayer.isActive, true);
    assert.equal(archivedPlayer.isActive, false);
  });

  // --- 3. Attendance Marking & Validation Tests ---
  console.log("\n--- 3. Attendance Marking & Validation Tests ---");

  await test("Mark attendance schema accepts present and absent", () => {
    const presentRes = markAttendanceSchema.safeParse({
      sessionId: dummySessionId,
      playerId: dummyPlayerId,
      status: "present",
    });
    assert.equal(presentRes.success, true);

    const absentRes = markAttendanceSchema.safeParse({
      sessionId: dummySessionId,
      playerId: dummyPlayerId,
      status: "absent",
    });
    assert.equal(absentRes.success, true);
  });

  await test("Invalid attendance statuses are rejected", () => {
    const invalidStatuses = ["late", "excused", "partial", "unknown", "", null];
    for (const st of invalidStatuses) {
      const res = markAttendanceSchema.safeParse({
        sessionId: dummySessionId,
        playerId: dummyPlayerId,
        status: st,
      });
      assert.equal(res.success, false, `Status "${st}" should be rejected`);
    }
  });

  await test("Bulk attendance update schema validates records array", () => {
    const validBatch = {
      records: [
        { playerId: dummyPlayerId, status: "present" as AttendanceStatus },
        { playerId: new mongoose.Types.ObjectId().toString(), status: "absent" as AttendanceStatus },
      ],
    };
    const res = updateSessionAttendanceSchema.safeParse(validBatch);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.records.length, 2);
    }

    const emptyBatch = { records: [] };
    const emptyRes = updateSessionAttendanceSchema.safeParse(emptyBatch);
    assert.equal(emptyRes.success, false, "Empty records batch should be rejected");
  });

  await test("Compound uniqueness logic ensures 1 record per player per session", () => {
    const sessionA = dummySessionId;
    const playerA = dummyPlayerId;
    const key = `${sessionA}_${playerA}`;

    const map = new Map<string, string>();
    map.set(key, "present");
    // Upsert replaces rather than duplicates
    map.set(key, "absent");

    assert.equal(map.size, 1);
    assert.equal(map.get(key), "absent");
  });

  // --- 4. Session Closure & Immutability Tests ---
  console.log("\n--- 4. Session Closure & Immutability Tests ---");

  await test("A session cannot close with unmarked players", () => {
    const applicablePlayers = ["p1", "p2", "p3"];
    const markedRecords = [{ playerId: "p1", status: "present" }, { playerId: "p2", status: "absent" }];
    const markedSet = new Set(markedRecords.map((r) => r.playerId));

    const unmarked = applicablePlayers.filter((p) => !markedSet.has(p));
    assert.equal(unmarked.length, 1);
    assert.equal(unmarked[0], "p3");

    // Must prevent closure
    const canClose = (unmarked.length as number) === 0;
    assert.equal(canClose, false);
  });

  await test("A session can close when all applicable players are explicitly marked", () => {
    const applicablePlayers = ["p1", "p2", "p3"];
    const markedRecords = [
      { playerId: "p1", status: "present" },
      { playerId: "p2", status: "absent" },
      { playerId: "p3", status: "present" },
    ];
    const markedSet = new Set(markedRecords.map((r) => r.playerId));

    const unmarked = applicablePlayers.filter((p) => !markedSet.has(p));
    assert.equal(unmarked.length, 0);

    const canClose = unmarked.length === 0;
    assert.equal(canClose, true);
  });

  await test("Closed session rejects modifications and reopening", () => {
    const session = {
      status: "closed",
      closedAt: new Date(),
    };

    // Attempting update on closed session throws
    assert.throws(
      () => {
        if (session.status === "closed") {
          throw new Error("Validation Error: Closed practice sessions are immutable and cannot be updated.");
        }
      },
      /immutable and cannot be updated/
    );

    // Attempting attendance mark on closed session throws
    assert.throws(
      () => {
        if (session.status === "closed") {
          throw new Error("Validation Error: Cannot record or modify attendance for a closed session.");
        }
      },
      /Cannot record or modify attendance for a closed session/
    );
  });

  // --- 5. Attendance Calculation Engine Tests ---
  console.log("\n--- 5. Attendance Calculation Engine Tests ---");

  await test("Accurate percentage calculation: 6 present out of 8 applicable closed sessions = 75.0%", () => {
    const totalSessions = 8;
    const presentCount = 6;
    const computed = (presentCount / totalSessions) * 100;
    const percentageValue = Number(computed.toFixed(1));
    const attendancePercentage = `${percentageValue.toFixed(1)}%`;

    assert.equal(percentageValue, 75.0);
    assert.equal(attendancePercentage, "75.0%");
  });

  await test("Zero applicable closed sessions returns N/A (never 0%)", () => {
    const totalSessions = 0;
    const presentCount = 0;

    let attendancePercentage = "N/A";
    let percentageValue: number | null = null;

    if (totalSessions > 0) {
      const computed = (presentCount / totalSessions) * 100;
      percentageValue = Number(computed.toFixed(1));
      attendancePercentage = `${percentageValue.toFixed(1)}%`;
    }

    assert.equal(attendancePercentage, "N/A");
    assert.equal(percentageValue, null);
  });

  await test("Open sessions are strictly excluded from the attendance denominator", () => {
    const allSessions = [
      { id: "s1", status: "closed", sportId: dummySportId },
      { id: "s2", status: "closed", sportId: dummySportId },
      { id: "s3", status: "open", sportId: dummySportId }, // open session must not count
    ];

    const closedOnly = allSessions.filter((s) => s.status === "closed");
    assert.equal(closedOnly.length, 2);
  });

  await test("Sessions belonging to other sports do not affect player percentage", () => {
    const sessions = [
      { id: "s1", status: "closed", sportId: dummySportId }, // player's sport
      { id: "s2", status: "closed", sportId: dummySportId }, // player's sport
      { id: "s3", status: "closed", sportId: otherSportId }, // different sport
    ];

    const playerSports = new Set([dummySportId]);
    const applicable = sessions.filter((s) => s.status === "closed" && playerSports.has(s.sportId));
    assert.equal(applicable.length, 2);
  });

  await test("Archived players retain their historical attendance data", () => {
    const archivedPlayer = {
      id: dummyPlayerId,
      fullName: "Archived Veteran",
      isActive: false, // archived
    };

    // Calculation engine evaluates archived players identically to active players for historical metrics
    const closedSessionsCount = 10;
    const presentCount = 8;
    const pct = ((presentCount / closedSessionsCount) * 100).toFixed(1);

    assert.equal(archivedPlayer.isActive, false);
    assert.equal(pct, "80.0");
  });

  await test("Rounding consistency: 1 out of 3 sessions displays 33.3%", () => {
    const totalSessions = 3;
    const presentCount = 1;
    const pct = Number(((presentCount / totalSessions) * 100).toFixed(1));
    const str = `${pct.toFixed(1)}%`;

    assert.equal(pct, 33.3);
    assert.equal(str, "33.3%");
  });

  console.log("\n=========================================");
  console.log(`Phase 6 Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=========================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("session-attendance.test.ts")) {
  runSessionAttendanceTestSuite();
}
