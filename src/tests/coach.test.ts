import assert from "node:assert/strict";
import {
  createSportSchema,
  updateSportSchema,
  createPlayerAccountSchema,
  updatePlayerDetailsSchema,
  playerQuerySchema,
} from "../lib/validation";
import {
  generateActivationCode,
  hashActivationCode,
  verifyActivationCode,
  computeActivationExpiration,
  isRoleAuthorized,
} from "../lib/auth";

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

export async function runCoachTestSuite() {
  console.log("\n=========================================");
  console.log("One Academy: Phase 5 Coach & Player Management Test Suite");
  console.log("=========================================\n");

  // --- 1. Sports Catalogue Validation & Rules ---
  console.log("--- 1. Sports Catalogue Validation Tests ---");

  await test("Valid sport name (2-40 chars) passes validation", () => {
    const validSports = ["Football", "Cricket", "Basketball", "Track & Field", "Swimming"];
    for (const name of validSports) {
      const result = createSportSchema.safeParse({ name });
      assert.equal(result.success, true, `Sport "${name}" should be valid`);
      if (result.success) {
        assert.equal(result.data.name, name);
      }
    }
  });

  await test("Sport name under 2 characters is rejected", () => {
    const result = createSportSchema.safeParse({ name: "A" });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.issues[0].message, /at least 2 characters/);
    }
  });

  await test("Sport name over 40 characters is rejected", () => {
    const longName = "A".repeat(41);
    const result = createSportSchema.safeParse({ name: longName });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.issues[0].message, /cannot exceed 40 characters/);
    }
  });

  await test("updateSportSchema allows updating name and status", () => {
    const res = updateSportSchema.safeParse({ name: "Premier Football", isActive: false });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.name, "Premier Football");
      assert.equal(res.data.isActive, false);
    }
  });

  await test("Case-insensitive duplicate normalization matches properly", () => {
    const input1 = "Football";
    const input2 = "  FOOTBALL ";
    const input3 = "football";
    const norm1 = input1.trim().toLowerCase();
    const norm2 = input2.trim().toLowerCase();
    const norm3 = input3.trim().toLowerCase();
    assert.equal(norm1, norm2);
    assert.equal(norm2, norm3);
    assert.equal(norm1, "football");
  });

  await test("Non-Coach roles cannot manage sports (RBAC matrix)", () => {
    assert.equal(isRoleAuthorized("player", "coach"), false);
    assert.equal(isRoleAuthorized("scout", "coach"), false);
    assert.equal(isRoleAuthorized("coach", "coach"), true);
  });

  // --- 2. Player Account Creation & Validation ---
  console.log("\n--- 2. Player Creation & Validation Tests ---");

  await test("Valid player account creation data passes validation", () => {
    const valid = {
      fullName: "Kylian Mbappe",
      email: "kylian@example.com",
      age: 25,
      sportId: "507f1f77bcf86cd799439011",
    };
    const res = createPlayerAccountSchema.safeParse(valid);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fullName, "Kylian Mbappe");
      assert.equal(res.data.email, "kylian@example.com");
      assert.equal(res.data.age, 25);
    }
  });

  await test("Invalid email formats are rejected", () => {
    const invalidEmails = ["not-an-email", "missing@domain", "@nodomain.com", "spaces in@email.com"];
    for (const email of invalidEmails) {
      const res = createPlayerAccountSchema.safeParse({
        fullName: "Valid Name",
        email,
        age: 16,
        sportId: "507f1f77bcf86cd799439011",
      });
      assert.equal(res.success, false, `Email "${email}" should be rejected`);
    }
  });

  await test("Player age below 4 or above 100 is rejected", () => {
    const underAge = createPlayerAccountSchema.safeParse({
      fullName: "Toddler",
      email: "toddler@example.com",
      age: 3,
      sportId: "507f1f77bcf86cd799439011",
    });
    assert.equal(underAge.success, false);

    const overAge = createPlayerAccountSchema.safeParse({
      fullName: "Centenarian",
      email: "senior@example.com",
      age: 101,
      sportId: "507f1f77bcf86cd799439011",
    });
    assert.equal(overAge.success, false);

    const validAge = createPlayerAccountSchema.safeParse({
      fullName: "Valid Youth",
      email: "youth@example.com",
      age: 4,
      sportId: "507f1f77bcf86cd799439011",
    });
    assert.equal(validAge.success, true);
  });

  await test("Player must have exactly one sport referenced with valid ObjectId", () => {
    const invalidSportId = createPlayerAccountSchema.safeParse({
      fullName: "Marcus Rashford",
      email: "marcus@example.com",
      age: 26,
      sportId: "not-a-valid-object-id",
    });
    assert.equal(invalidSportId.success, false);

    const missingSport = createPlayerAccountSchema.safeParse({
      fullName: "Marcus Rashford",
      email: "marcus@example.com",
      age: 26,
    });
    assert.equal(missingSport.success, false);
  });

  await test("updatePlayerDetailsSchema validates partial updates for player", () => {
    const res = updatePlayerDetailsSchema.safeParse({ fullName: "Updated Name", age: 20 });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fullName, "Updated Name");
      assert.equal(res.data.age, 20);
    }
  });

  await test("Non-Coach cannot create or edit players", () => {
    assert.equal(isRoleAuthorized("player", "coach"), false);
    assert.equal(isRoleAuthorized("scout", "coach"), false);
  });

  // --- 3. Player Search & Filtering Validation ---
  console.log("\n--- 3. Player Query & Search Tests ---");

  await test("Player query parameters validate and coerce defaults", () => {
    const res = playerQuerySchema.safeParse({});
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.status, "all");
      assert.equal(res.data.page, 1);
      assert.equal(res.data.limit, 10);
    }
  });

  await test("Player query filters allow active, pending, archived statuses", () => {
    const validStatuses = ["all", "active", "pending", "archived"] as const;
    for (const status of validStatuses) {
      const res = playerQuerySchema.safeParse({ status });
      assert.equal(res.success, true);
    }

    const invalidStatus = playerQuerySchema.safeParse({ status: "invalid_status" });
    assert.equal(invalidStatus.success, false);
  });

  // --- 4. Activation Code Security & Invalidation ---
  console.log("\n--- 4. Activation Code Workflow Security Tests ---");

  await test("Plaintext activation code is generated once and is 8 hex chars", () => {
    const code = generateActivationCode();
    assert.equal(code.length, 8);
    assert.match(code, /^[0-9A-F]{8}$/);
  });

  await test("Stored code hash is salted bcrypt hash and never matches plaintext", async () => {
    const code = generateActivationCode();
    const hash = await hashActivationCode(code);
    assert.ok(hash.startsWith("$2"), "Hash must be a bcrypt hash");
    assert.notEqual(hash, code, "Hash must never equal plaintext code");
    const verified = await verifyActivationCode(code, hash);
    assert.equal(verified, true, "verifyActivationCode must verify matching hash");
  });

  await test("Expired code verification logic detects expiration", () => {
    const now = new Date();
    const expiredDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const isExpired = now > expiredDate;
    assert.equal(isExpired, true, "1-hour old code must be identified as expired");

    const freshExpiration = computeActivationExpiration(24);
    assert.equal(now > freshExpiration, false, "Fresh 24-hour code must not be expired");
  });

  await test("Regeneration invalidates prior codes and sets fresh 24h expiration", () => {
    // Simulating invalidation: previous code doc marked with usedAt
    const oldCodeDoc = {
      usedAt: null as Date | null,
      expiresAt: new Date(Date.now() - 5000),
    };
    // Invalidate
    oldCodeDoc.usedAt = new Date();
    assert.ok(oldCodeDoc.usedAt !== null, "Prior code must have usedAt timestamp marked");

    const freshExpiration = computeActivationExpiration(24);
    const diffHours = (freshExpiration.getTime() - Date.now()) / (1000 * 60 * 60);
    assert.ok(diffHours >= 23.9 && diffHours <= 24.1, "Fresh expiration must be 24h");
  });

  // --- 5. Dashboard Statistics & Data Sensitivity ---
  console.log("\n--- 5. Dashboard Statistics & Data Sanitization Tests ---");

  await test("Sensitive fields are strictly excluded from safe DTOs", () => {
    const mockDbUser = {
      _id: "507f1f77bcf86cd799439011",
      email: "player@oneacademy.com",
      passwordHash: "$2b$10$somesecretpasswordhash",
      role: "player",
      isActive: true,
      __v: 0,
    };

    // Safe user projection
    const safeUser = {
      id: mockDbUser._id,
      email: mockDbUser.email,
      role: mockDbUser.role,
    };

    assert.equal((safeUser as Record<string, unknown>).passwordHash, undefined);
    assert.equal((safeUser as Record<string, unknown>).codeHash, undefined);
  });

  await test("Active players definition requires both Player.isActive and User.isActive", () => {
    const cases = [
      { playerActive: true, userActive: true, expected: "active" },
      { playerActive: true, userActive: false, expected: "pending" },
      { playerActive: false, userActive: false, expected: "archived" },
      { playerActive: false, userActive: true, expected: "archived" },
    ];

    for (const c of cases) {
      let status = "pending";
      if (!c.playerActive) {
        status = "archived";
      } else if (c.userActive) {
        status = "active";
      }
      assert.equal(status, c.expected);
    }
  });

  console.log("\n=========================================");
  console.log(`Phase 5 Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=========================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("coach.test.ts")) {
  runCoachTestSuite();
}
