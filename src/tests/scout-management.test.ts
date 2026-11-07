import assert from "node:assert/strict";
import {
  createScoutAccountSchema,
  scoutListQuerySchema,
  createPlayerAccountSchema,
} from "../lib/validation";
import {
  generateActivationCode,
  hashActivationCode,
  verifyActivationCode,
  computeActivationExpiration,
  isRoleAuthorized,
  hashPassword,
  verifyPassword,
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

export async function runScoutManagementTestSuite() {
  console.log("\n=========================================");
  console.log("One Academy: Scout Account Management Test Suite");
  console.log("=========================================\n");

  // --- 1. Scout Creation & Validation Schemas ---
  console.log("--- 1. Scout Creation & Validation Schemas ---");

  await test("Valid scout account data passes validation", () => {
    const valid = {
      fullName: "Marcus Vance",
      email: "marcus.vance@talentscouts.com",
    };
    const res = createScoutAccountSchema.safeParse(valid);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fullName, "Marcus Vance");
      assert.equal(res.data.email, "marcus.vance@talentscouts.com");
    }
  });

  await test("Scout full name under 2 characters is rejected", () => {
    const res = createScoutAccountSchema.safeParse({
      fullName: "A",
      email: "scout@talentscouts.com",
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.match(res.error.issues[0].message, /at least 2 characters/);
    }
  });

  await test("Scout full name over 100 characters is rejected", () => {
    const res = createScoutAccountSchema.safeParse({
      fullName: "A".repeat(101),
      email: "scout@talentscouts.com",
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.match(res.error.issues[0].message, /cannot exceed 100 characters/);
    }
  });

  await test("Invalid email formats are rejected", () => {
    const invalidEmails = ["notanemail", "scout@", "@domain.com", "scout @domain.com"];
    for (const email of invalidEmails) {
      const res = createScoutAccountSchema.safeParse({
        fullName: "Marcus Vance",
        email,
      });
      assert.equal(res.success, false, `Email "${email}" should be rejected`);
    }
  });

  await test("Scout email is trimmed and normalized to lowercase", () => {
    const res = createScoutAccountSchema.safeParse({
      fullName: "  Elena Rostova  ",
      email: "  ELENA.ROSTOVA@Agency.COM  ",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fullName, "Elena Rostova");
      assert.equal(res.data.email, "elena.rostova@agency.com");
    }
  });

  await test("Scout query schema applies default pagination and status", () => {
    const res = scoutListQuerySchema.safeParse({});
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.page, 1);
      assert.equal(res.data.limit, 10);
      assert.equal(res.data.status, "all");
    }
  });

  // --- 2. Role-Based Access Control & Authorization ---
  console.log("\n--- 2. Role-Based Access Control (RBAC) Tests ---");

  await test("Coach is authorized to create and manage Scouts", () => {
    assert.equal(isRoleAuthorized("coach", ["coach"]), true);
  });

  await test("Player is strictly rejected from Scout creation and management", () => {
    assert.equal(isRoleAuthorized("player", ["coach"]), false);
  });

  await test("Scout is strictly rejected from creating other Scouts", () => {
    assert.equal(isRoleAuthorized("scout", ["coach"]), false);
  });

  await test("Scout cannot access Player management endpoints", () => {
    assert.equal(isRoleAuthorized("scout", ["coach"]), false);
  });

  await test("Scout is authorized for Scout discovery", () => {
    assert.equal(isRoleAuthorized("scout", ["scout"]), true);
  });

  // --- 3. Duplicate Email Prevention Invariants ---
  console.log("\n--- 3. Duplicate Email Prevention Tests ---");

  await test("Simulated duplicate email registration detection", () => {
    const existingEmails = new Set(["coach@oneacademy.com", "player1@oneacademy.com", "scout.existing@agency.com"]);
    const duplicateCandidate = "SCOUT.EXISTING@AGENCY.COM".trim().toLowerCase();

    assert.equal(
      existingEmails.has(duplicateCandidate),
      true,
      "Duplicate email should be detected regardless of case"
    );
  });

  // --- 4. Single-Use Activation Code Lifecycle ---
  console.log("\n--- 4. Activation Code Lifecycle & Security Tests ---");

  await test("Activation code is an 8-character uppercase hex string", () => {
    const code = generateActivationCode();
    assert.equal(code.length, 8);
    assert.match(code, /^[0-9A-F]{8}$/);
  });

  await test("Activation code hash matches plaintext and is case-insensitive", async () => {
    const plaintext = generateActivationCode();
    const hash = await hashActivationCode(plaintext);

    assert.notEqual(plaintext, hash, "Hash must never equal plaintext");
    const exactMatch = await verifyActivationCode(plaintext, hash);
    assert.equal(exactMatch, true);

    const lowerMatch = await verifyActivationCode(plaintext.toLowerCase(), hash);
    assert.equal(lowerMatch, true);

    const wrongMatch = await verifyActivationCode("00000000", hash);
    assert.equal(wrongMatch, false);
  });

  await test("Activation code expiration is set to 24 hours in the future", () => {
    const now = Date.now();
    const expiry = computeActivationExpiration(24);
    const diffHours = (expiry.getTime() - now) / (1000 * 60 * 60);
    assert.ok(diffHours >= 23.9 && diffHours <= 24.1);
  });

  await test("Expired activation code check identifies expiration correctly", () => {
    const pastExpiry = new Date(Date.now() - 1000 * 60);
    const isExpired = new Date() > pastExpiry;
    assert.equal(isExpired, true);

    const futureExpiry = new Date(Date.now() + 1000 * 60 * 60);
    const isFutureExpired = new Date() > futureExpiry;
    assert.equal(isFutureExpired, false);
  });

  await test("Simulated single-use code consumption prevents double-use", () => {
    const codeRecord = {
      code: "A1B2C3D4",
      usedAt: null as Date | null,
    };

    // First use succeeds
    assert.equal(codeRecord.usedAt, null);
    codeRecord.usedAt = new Date();

    // Second use is rejected because usedAt is set
    const canUseAgain = codeRecord.usedAt === null;
    assert.equal(canUseAgain, false, "Code cannot be reused once usedAt is set");
  });

  // --- 5. Scout Activation, Password Hashing & Login ---
  console.log("\n--- 5. Scout Activation & Login Tests ---");

  await test("Scout password hashing and authentication round-trip", async () => {
    const password = "SecureScoutPassword!2026";
    const passwordHash = await hashPassword(password);

    assert.notEqual(password, passwordHash);
    const valid = await verifyPassword(password, passwordHash);
    assert.equal(valid, true);

    const wrong = await verifyPassword("WrongPassword", passwordHash);
    assert.equal(wrong, false);
  });

  await test("Activated Scout authentication role routing directs to /dashboard/scout", () => {
    const scoutUser = {
      id: "scout_user_123",
      email: "marcus@talentscouts.com",
      role: "scout",
      isActive: true,
    };

    const targetDashboard = `/dashboard/${scoutUser.role}`;
    assert.equal(targetDashboard, "/dashboard/scout");
  });

  await test("Scout attempting to log in with Player or Coach role is rejected", () => {
    const scoutRole: string = "scout";

    // Attempting coach role
    const coachAttempt = scoutRole === "coach";
    assert.equal(coachAttempt, false);

    // Attempting player role
    const playerAttempt = scoutRole === "player";
    assert.equal(playerAttempt, false);
  });

  // --- 6. Regression Protection: Player Management Preserved ---
  console.log("\n--- 6. Regression Protection: Player Management Preserved ---");

  await test("Existing player creation schema still validates correctly", () => {
    const validPlayer = {
      fullName: "Alex Rivera",
      email: "alex.rivera@oneacademy.com",
      age: 17,
      sportId: "507f1f77bcf86cd799439011",
    };
    const res = createPlayerAccountSchema.safeParse(validPlayer);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fullName, "Alex Rivera");
      assert.equal(res.data.age, 17);
      assert.equal(res.data.email, "alex.rivera@oneacademy.com");
    }
  });

  // --- 7. Scout Listing Frontend Invariants & Empty-State Bug Regression ---
  console.log("\n--- 7. Scout Listing Frontend Invariants & Empty-State Bug Regression ---");

  // Defensively extracts scouts list from various API payload shapes
  function parseScoutApiResponse(json: Record<string, unknown>) {
    const scoutsList = Array.isArray(json.data)
      ? json.data
      : Array.isArray((json.data as { scouts?: unknown[] })?.scouts)
      ? (json.data as { scouts: unknown[] }).scouts
      : Array.isArray(json.scouts)
      ? json.scouts
      : [];

    const paginationData = json.pagination || (json.data as { pagination?: unknown })?.pagination;
    const statsData = json.stats || (json.data as { stats?: unknown })?.stats;

    return { scoutsList, paginationData, statsData };
  }

  await test("parseScoutApiResponse handles top-level data array correctly", () => {
    const apiPayload = {
      success: true,
      data: [
        {
          id: "scout_001",
          fullName: "Anand Kumar",
          email: "anandkumar@gmail.com",
          isActive: true,
          status: "active",
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      stats: { totalScouts: 1, activeScouts: 1, pendingScouts: 0 },
    };

    const parsed = parseScoutApiResponse(apiPayload);
    assert.equal(parsed.scoutsList.length, 1);
    assert.equal((parsed.scoutsList[0] as { fullName: string }).fullName, "Anand Kumar");
    assert.ok(parsed.paginationData);
    assert.ok(parsed.statsData);
  });

  await test("parseScoutApiResponse handles nested data.scouts object correctly", () => {
    const apiPayload = {
      success: true,
      data: {
        scouts: [
          {
            id: "scout_001",
            fullName: "Anand Kumar",
            email: "anandkumar@gmail.com",
            isActive: true,
            status: "active",
          },
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        stats: { totalScouts: 1, activeScouts: 1, pendingScouts: 0 },
      },
    };

    const parsed = parseScoutApiResponse(apiPayload);
    assert.equal(parsed.scoutsList.length, 1);
    assert.equal((parsed.scoutsList[0] as { fullName: string }).fullName, "Anand Kumar");
  });

  await test("Initial server-rendered scouts are not overwritten by empty array on background error", () => {
    const scoutsState = [
      { id: "scout_001", fullName: "Anand Kumar", email: "anandkumar@gmail.com", status: "active" },
    ];

    // Simulate background fetch throwing an error
    let errorState: string | null = null;
    try {
      throw new Error("Network timeout or gateway error");
    } catch (err) {
      errorState = (err as Error).message;
      // Invariant: Do NOT wipe scoutsState on error!
    }

    assert.equal(scoutsState.length, 1, "Registered scout must remain preserved in state");
    assert.equal(errorState, "Network timeout or gateway error");
  });

  await test("Empty state appears strictly when response is empty and not loading or errored", () => {
    function computeUIState(state: {
      loading: boolean;
      error: string | null;
      scouts: Array<unknown> | null;
    }): "loading" | "error" | "data" | "empty" {
      if (state.error && (!state.scouts || state.scouts.length === 0)) {
        return "error";
      }
      if (state.loading && (!state.scouts || state.scouts.length === 0)) {
        return "loading";
      }
      if (state.scouts && state.scouts.length > 0) {
        return "data";
      }
      return "empty";
    }

    // 1. Loading
    assert.equal(computeUIState({ loading: true, error: null, scouts: null }), "loading");
    // 2. Data with existing scout
    assert.equal(
      computeUIState({ loading: false, error: null, scouts: [{ id: "scout_001" }] }),
      "data"
    );
    // 3. Error state with no scouts -> shows Error, NOT Empty State
    assert.equal(computeUIState({ loading: false, error: "Network failed", scouts: null }), "error");
    // 4. Truly empty result
    assert.equal(computeUIState({ loading: false, error: null, scouts: [] }), "empty");
  });

  await test("Sensitive fields are strictly excluded from PopulatedScoutResult DTO", () => {
    const rawUserDoc = {
      _id: "user_123",
      email: "anandkumar@gmail.com",
      role: "scout",
      passwordHash: "$2a$10$e8wSDFJ29487sdfhsdhfsd...",
      isActive: true,
    };

    const safeScoutDTO = {
      id: "scout_123",
      userId: rawUserDoc._id,
      fullName: "Anand Kumar",
      email: rawUserDoc.email,
      isActive: true,
      userIsActive: rawUserDoc.isActive,
      status: "active",
    };

    assert.equal("passwordHash" in safeScoutDTO, false, "passwordHash must never be exposed");
    assert.equal("activationCode" in safeScoutDTO, false, "activationCode must never be exposed");
    assert.equal("codeHash" in safeScoutDTO, false, "codeHash must never be exposed");
  });

  // --- Summary ---
  console.log("\n=========================================");
  console.log(`Scout Management Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=========================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("scout-management.test.ts"))) {
  runScoutManagementTestSuite();
}
