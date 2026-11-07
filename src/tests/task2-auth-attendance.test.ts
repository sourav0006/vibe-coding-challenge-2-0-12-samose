import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import assert from "node:assert/strict";
import { RateLimiter, loginRateLimiter, activationRateLimiter } from "../lib/auth/rate-limiter";
import { RoleMismatchError, AttendanceService } from "../lib/services";
import mongoose from "mongoose";

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

async function runTask2TestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Task 2 Auth, Rate-Limiting & Attendance Reliability Tests");
  console.log("========================================================\n");

  // 1. Rate Limiter Cooldown & Refund Tests
  console.log("--- 1. Rate Limiter Cooldown & Attempt Allowance Tests ---");

  await test("Rate limiter is configured with 2-minute (120s) window and 5 max requests", () => {
    assert.equal(loginRateLimiter.windowMs, 120000, "Window must be 2 minutes (120,000 ms)");
    assert.equal(loginRateLimiter.maxRequests, 5, "Max requests must be 5");
    assert.equal(activationRateLimiter.windowMs, 120000, "Activation window must be 2 minutes");
  });

  await test("Rate limiter allows 5 failed attempts and blocks 6th with cooldown <= 120s", () => {
    const limiter = new RateLimiter(2 * 60 * 1000, 5);
    const testKey = `test-user-${Date.now()}`;

    for (let i = 1; i <= 5; i++) {
      const res = limiter.check(testKey);
      assert.equal(res.allowed, true, `Attempt ${i} should be allowed`);
      assert.equal(res.remaining, 5 - i);
    }

    const blocked = limiter.check(testKey);
    assert.equal(blocked.allowed, false, "6th attempt must be blocked");
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 120, "Cooldown must be <= 120 seconds");
  });

  await test("Rate limiter refund() removes penalty without consuming allowance", () => {
    const limiter = new RateLimiter(2 * 60 * 1000, 5);
    const testKey = `test-refund-${Date.now()}`;

    // 4 attempts made
    for (let i = 0; i < 4; i++) {
      limiter.check(testKey);
    }
    // 5th attempt made (e.g. valid password, wrong role)
    const fifth = limiter.check(testKey);
    assert.equal(fifth.allowed, true);
    assert.equal(fifth.remaining, 0);

    // Refund the 5th attempt
    limiter.refund(testKey);

    // User tries again: should be allowed because previous attempt was refunded
    const retry = limiter.check(testKey);
    assert.equal(retry.allowed, true, "Refunded key must allow another attempt");
  });

  await test("Rate limiter reset() immediately clears failed attempts", () => {
    const limiter = new RateLimiter(2 * 60 * 1000, 5);
    const testKey = `test-reset-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      limiter.check(testKey);
    }
    assert.equal(limiter.check(testKey).allowed, false, "Should be blocked after 5 attempts");

    limiter.reset(testKey);
    const afterReset = limiter.check(testKey);
    assert.equal(afterReset.allowed, true, "Must be allowed after reset");
    assert.equal(afterReset.remaining, 4);
  });

  await test("Rate limiter isolates accounts: Account A lockout does NOT block Account B", () => {
    const limiter = new RateLimiter(2 * 60 * 1000, 5);
    const keyA = `login:127.0.0.1:playerA@academy.com`;
    const keyB = `login:127.0.0.1:playerB@academy.com`;

    for (let i = 0; i < 5; i++) {
      limiter.check(keyA);
    }
    assert.equal(limiter.check(keyA).allowed, false, "Account A must be rate-limited");
    assert.equal(limiter.check(keyB).allowed, true, "Account B must NOT be affected by Account A's lockout");
  });

  // 2. Role Mismatch Error & Exemption Tests
  console.log("\n--- 2. Role Mismatch Detection & Error Handling Tests ---");

  await test("RoleMismatchError carries actualRole and actionable instructions", () => {
    const err = new RoleMismatchError(
      "This account is registered as a Player. Please select the Player portal to sign in.",
      "player"
    );
    assert.equal(err.name, "RoleMismatchError");
    assert.equal(err.actualRole, "player");
    assert.match(err.message, /This account is registered as a Player/);
  });

  // 3. Attendance Eligibility for Newly Registered Players
  console.log("\n--- 3. Attendance Eligibility for Newly Registered Players ---");

  await test("Player registered AFTER a session was closed is NOT eligible for that session", () => {
    const sessionClosedAt = new Date("2026-11-07T06:05:51.100Z");
    const playerRegisteredAt = new Date("2026-11-07T06:12:16.779Z");
    const sportId = new mongoose.Types.ObjectId();

    const player = {
      sportId,
      createdAt: playerRegisteredAt,
      sportHistory: [
        {
          sportId,
          effectiveFrom: playerRegisteredAt,
          effectiveTo: null,
        },
      ],
    };

    const isEligible = AttendanceService.isPlayerEligibleForSession(
      player,
      sportId,
      new Date("2026-11-07T00:00:00.000Z"),
      {
        status: "closed",
        closedAt: sessionClosedAt,
      }
    );

    assert.equal(isEligible, false, "Player joined after session closed; must NOT be eligible");
  });

  await test("Player registered BEFORE a session was closed IS eligible for that session", () => {
    const sessionClosedAt = new Date("2026-11-07T06:05:51.100Z");
    const playerRegisteredAt = new Date("2026-11-05T13:06:32.990Z");
    const sportId = new mongoose.Types.ObjectId();

    const player = {
      sportId,
      createdAt: playerRegisteredAt,
      sportHistory: [
        {
          sportId,
          effectiveFrom: playerRegisteredAt,
          effectiveTo: null,
        },
      ],
    };

    const isEligible = AttendanceService.isPlayerEligibleForSession(
      player,
      sportId,
      new Date("2026-11-07T00:00:00.000Z"),
      {
        status: "closed",
        closedAt: sessionClosedAt,
      }
    );

    assert.equal(isEligible, true, "Player joined before session closed; must be eligible");
  });

  await test("Player registered today IS eligible for an OPEN practice session scheduled today", () => {
    const now = new Date();
    const sportId = new mongoose.Types.ObjectId();

    const player = {
      sportId,
      createdAt: now,
      sportHistory: [
        {
          sportId,
          effectiveFrom: now,
          effectiveTo: null,
        },
      ],
    };

    const isEligible = AttendanceService.isPlayerEligibleForSession(
      player,
      sportId,
      now,
      {
        status: "open",
        closedAt: null,
      }
    );

    assert.equal(isEligible, true, "Player registered today must be eligible for open sessions today");
  });

  await test("Player registered on Nov 7 is NOT eligible for historical Nov 5 session", () => {
    const playerRegisteredAt = new Date("2026-11-07T06:12:16.779Z");
    const sportId = new mongoose.Types.ObjectId();

    const player = {
      sportId,
      createdAt: playerRegisteredAt,
      sportHistory: [
        {
          sportId,
          effectiveFrom: playerRegisteredAt,
          effectiveTo: null,
        },
      ],
    };

    const isEligible = AttendanceService.isPlayerEligibleForSession(
      player,
      sportId,
      new Date("2026-11-05T00:00:00.000Z"),
      {
        status: "closed",
        closedAt: new Date("2026-11-05T18:00:00.000Z"),
      }
    );

    assert.equal(isEligible, false, "Player joined on Nov 7 must not be eligible for Nov 5 session");
  });

  console.log("\n========================================================");
  console.log(`Task 2 Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTask2TestSuite().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
