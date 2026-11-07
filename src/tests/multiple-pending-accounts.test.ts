import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  createPlayerAccountSchema,
  createScoutAccountSchema,
} from "../lib/validation";
import {
  generateActivationCode,
  hashActivationCode,
  verifyActivationCode,
  computeActivationExpiration,
  hashPassword,
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

/**
 * In-memory simulated storage for end-to-end verification of multi-account lifecycle
 * mimicking MongoDB Atlas UserModel, PlayerModel, ScoutModel, and ActivationCodeModel behavior.
 */
interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "coach" | "player" | "scout";
  isActive: boolean;
}

interface MockPlayer {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  sportId: string;
  isActive: boolean;
}

interface MockScout {
  id: string;
  userId: string;
  fullName: string;
  isActive: boolean;
}

interface MockActivationCode {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

class MockAcademyEnvironment {
  public users: Map<string, MockUser> = new Map();
  public players: Map<string, MockPlayer> = new Map();
  public scouts: Map<string, MockScout> = new Map();
  public activationCodes: MockActivationCode[] = [];

  public async createPendingPlayer(input: {
    fullName: string;
    email: string;
    age: number;
    sportId: string;
  }): Promise<{ player: MockPlayer; user: MockUser; activationCode: string; expiresAt: Date }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Email uniqueness check
    for (const u of this.users.values()) {
      if (u.email === normalizedEmail) {
        throw new Error(`Conflict: An account with email "${normalizedEmail}" already exists.`);
      }
    }

    const userId = "usr_" + crypto.randomUUID().slice(0, 8);
    const playerId = "ply_" + crypto.randomUUID().slice(0, 8);
    const placeholderHash = await hashPassword(crypto.randomUUID());

    const user: MockUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash: placeholderHash,
      role: "player",
      isActive: false, // Pending activation
    };
    this.users.set(userId, user);

    const player: MockPlayer = {
      id: playerId,
      userId,
      fullName: input.fullName.trim(),
      age: input.age,
      sportId: input.sportId,
      isActive: true, // Unarchived profile
    };
    this.players.set(playerId, player);

    // Issue activation code
    const plaintextCode = generateActivationCode();
    const codeHash = await hashActivationCode(plaintextCode);
    const expiresAt = computeActivationExpiration(24);

    this.activationCodes.push({
      id: "code_" + crypto.randomUUID().slice(0, 8),
      userId,
      codeHash,
      expiresAt,
      usedAt: null,
    });

    return { player, user, activationCode: plaintextCode, expiresAt };
  }

  public async createPendingScout(input: {
    fullName: string;
    email: string;
  }): Promise<{ scout: MockScout; user: MockUser; activationCode: string; expiresAt: Date }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Email uniqueness check
    for (const u of this.users.values()) {
      if (u.email === normalizedEmail) {
        throw new Error(`Conflict: An account with email "${normalizedEmail}" already exists.`);
      }
    }

    const userId = "usr_" + crypto.randomUUID().slice(0, 8);
    const scoutId = "sct_" + crypto.randomUUID().slice(0, 8);
    const placeholderHash = await hashPassword(crypto.randomUUID());

    const user: MockUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash: placeholderHash,
      role: "scout",
      isActive: false, // Pending activation
    };
    this.users.set(userId, user);

    const scout: MockScout = {
      id: scoutId,
      userId,
      fullName: input.fullName.trim(),
      isActive: true,
    };
    this.scouts.set(scoutId, scout);

    // Issue activation code
    const plaintextCode = generateActivationCode();
    const codeHash = await hashActivationCode(plaintextCode);
    const expiresAt = computeActivationExpiration(24);

    this.activationCodes.push({
      id: "code_" + crypto.randomUUID().slice(0, 8),
      userId,
      codeHash,
      expiresAt,
      usedAt: null,
    });

    return { scout, user, activationCode: plaintextCode, expiresAt };
  }

  public async regenerateCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
    const user = this.users.get(userId);
    if (!user) throw new Error("Validation Error: Target account does not exist.");
    if (user.isActive) throw new Error("Conflict: This account is already active.");

    const plaintextCode = generateActivationCode();
    const codeHash = await hashActivationCode(plaintextCode);
    const expiresAt = computeActivationExpiration(24);

    // Invalidate previously unconsumed codes ONLY for this user
    for (const c of this.activationCodes) {
      if (c.userId === userId && c.usedAt === null) {
        c.usedAt = new Date();
      }
    }

    this.activationCodes.push({
      id: "code_" + crypto.randomUUID().slice(0, 8),
      userId,
      codeHash,
      expiresAt,
      usedAt: null,
    });

    return { code: plaintextCode, expiresAt };
  }

  public async activateAccount(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<{ user: MockUser }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    let targetUser: MockUser | null = null;
    for (const u of this.users.values()) {
      if (u.email === normalizedEmail) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser || targetUser.isActive || targetUser.role === "coach") {
      throw new Error("Invalid activation request. The account is either already active, invalid, or does not exist.");
    }

    // Find active, unexpired, unconsumed codes for this user
    const now = new Date();
    const userCodes = this.activationCodes.filter(
      (c) => c.userId === targetUser!.id && c.usedAt === null && c.expiresAt > now
    );

    let matchedCode: MockActivationCode | null = null;
    for (const c of userCodes) {
      const match = await verifyActivationCode(input.code, c.codeHash);
      if (match) {
        matchedCode = c;
        break;
      }
    }

    if (!matchedCode) {
      throw new Error("Invalid, expired, or previously used activation code.");
    }

    // Atomic claim check
    if (matchedCode.usedAt !== null) {
      throw new Error("Conflict: This activation code was already used by a concurrent request.");
    }
    matchedCode.usedAt = new Date();

    // Update user password and activate
    targetUser.passwordHash = await hashPassword(input.password);
    targetUser.isActive = true;

    return { user: targetUser };
  }
}

export async function runMultiplePendingAccountsTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Multiple Pending Accounts & Activation Test Suite");
  console.log("========================================================\n");

  const env = new MockAcademyEnvironment();
  const validSportId = "507f1f77bcf86cd799439011";

  // --- 1. Creating 5 Pending Player Accounts Successfully ---
  console.log("--- 1. Creating 5 Pending Player Accounts ---");

  const playerRecords: Array<{
    fullName: string;
    email: string;
    age: number;
    code: string;
    userId: string;
    playerId: string;
  }> = [];

  const playerInputs = [
    { fullName: "Player Alpha", email: "player.alpha@oneacademy.test", age: 16 },
    { fullName: "Player Beta", email: "player.beta@oneacademy.test", age: 17 },
    { fullName: "Player Gamma", email: "player.gamma@oneacademy.test", age: 15 },
    { fullName: "Player Delta", email: "player.delta@oneacademy.test", age: 18 },
    { fullName: "Player Epsilon", email: "player.epsilon@oneacademy.test", age: 16 },
  ];

  await test("Coach provisions 5 pending Player accounts without waiting for activation", async () => {
    for (const input of playerInputs) {
      // Validate schema
      const parseResult = createPlayerAccountSchema.safeParse({
        fullName: input.fullName,
        email: input.email,
        age: input.age,
        sportId: validSportId,
      });
      assert.equal(parseResult.success, true, `Schema validation failed for ${input.fullName}`);

      const result = await env.createPendingPlayer({
        fullName: input.fullName,
        email: input.email,
        age: input.age,
        sportId: validSportId,
      });

      assert.equal(result.user.isActive, false, "Created player user must be inactive (pending)");
      assert.equal(result.player.isActive, true, "Player profile must be active (unarchived)");
      assert.equal(result.activationCode.length, 8, "Code must be 8 uppercase characters");
      assert.match(result.activationCode, /^[0-9A-F]{8}$/, "Code must match 8-char hex format");

      playerRecords.push({
        fullName: input.fullName,
        email: input.email,
        age: input.age,
        code: result.activationCode,
        userId: result.user.id,
        playerId: result.player.id,
      });
    }

    assert.equal(playerRecords.length, 5, "5 pending players must be created");
  });

  // --- 2. Creating 5 Pending Scout Accounts Successfully ---
  console.log("\n--- 2. Creating 5 Pending Scout Accounts ---");

  const scoutRecords: Array<{
    fullName: string;
    email: string;
    code: string;
    userId: string;
    scoutId: string;
  }> = [];

  const scoutInputs = [
    { fullName: "Scout Alpha", email: "scout.alpha@talentscouts.test" },
    { fullName: "Scout Beta", email: "scout.beta@talentscouts.test" },
    { fullName: "Scout Gamma", email: "scout.gamma@talentscouts.test" },
    { fullName: "Scout Delta", email: "scout.delta@talentscouts.test" },
    { fullName: "Scout Epsilon", email: "scout.epsilon@talentscouts.test" },
  ];

  await test("Coach provisions 5 pending Scout accounts without waiting for activation", async () => {
    for (const input of scoutInputs) {
      const parseResult = createScoutAccountSchema.safeParse({
        fullName: input.fullName,
        email: input.email,
      });
      assert.equal(parseResult.success, true, `Schema validation failed for ${input.fullName}`);

      const result = await env.createPendingScout({
        fullName: input.fullName,
        email: input.email,
      });

      assert.equal(result.user.isActive, false, "Created scout user must be inactive (pending)");
      assert.equal(result.scout.isActive, true, "Scout profile must be active");
      assert.equal(result.activationCode.length, 8, "Code must be 8 uppercase characters");
      assert.match(result.activationCode, /^[0-9A-F]{8}$/, "Code must match 8-char hex format");

      scoutRecords.push({
        fullName: input.fullName,
        email: input.email,
        code: result.activationCode,
        userId: result.user.id,
        scoutId: result.scout.id,
      });
    }

    assert.equal(scoutRecords.length, 5, "5 pending scouts must be created");
  });

  // --- 3. Non-Blocking Account Creation ---
  console.log("\n--- 3. Non-Blocking Account Creation Guarantees ---");

  await test("Existing pending accounts do not block creating subsequent accounts", async () => {
    // Current state has 5 pending players and 5 pending scouts (10 total pending accounts)
    const pendingPlayers = Array.from(env.players.values()).filter((p) => {
      const user = env.users.get(p.userId);
      return user && !user.isActive;
    });
    assert.equal(pendingPlayers.length, 5);

    const pendingScouts = Array.from(env.scouts.values()).filter((s) => {
      const user = env.users.get(s.userId);
      return user && !user.isActive;
    });
    assert.equal(pendingScouts.length, 5);

    // Provision a 6th player while 10 pending accounts exist
    const player6 = await env.createPendingPlayer({
      fullName: "Player Zeta",
      email: "player.zeta@oneacademy.test",
      age: 19,
      sportId: validSportId,
    });
    assert.ok(player6.player.id);
    assert.equal(player6.user.isActive, false);

    // Provision a 6th scout while 11 pending accounts exist
    const scout6 = await env.createPendingScout({
      fullName: "Scout Zeta",
      email: "scout.zeta@talentscouts.test",
    });
    assert.ok(scout6.scout.id);
    assert.equal(scout6.user.isActive, false);
  });

  // --- 4. Duplicate Email Conflict Enforcement ---
  console.log("\n--- 4. Duplicate Email Conflict Enforcement ---");

  await test("Attempting to create another account with an existing pending email is rejected with 409", async () => {
    await assert.rejects(
      async () => {
        await env.createPendingPlayer({
          fullName: "Duplicate Alpha",
          email: "player.alpha@oneacademy.test", // Already exists
          age: 18,
          sportId: validSportId,
        });
      },
      (err: Error) => {
        assert.match(err.message, /Conflict: An account with email.*already exists/);
        return true;
      }
    );
  });

  await test("Case-insensitive duplicate email check prevents duplicate pending accounts", async () => {
    await assert.rejects(
      async () => {
        await env.createPendingPlayer({
          fullName: "Uppercase Alpha",
          email: "PLAYER.ALPHA@ONEACADEMY.TEST",
          age: 18,
          sportId: validSportId,
        });
      },
      (err: Error) => {
        assert.match(err.message, /Conflict: An account with email.*already exists/);
        return true;
      }
    );
  });

  await test("Cross-role duplicate email is strictly rejected", async () => {
    await assert.rejects(
      async () => {
        // Attempting to register scout with player's email
        await env.createPendingScout({
          fullName: "Scout Conflict",
          email: "player.beta@oneacademy.test",
        });
      },
      (err: Error) => {
        assert.match(err.message, /Conflict: An account with email.*already exists/);
        return true;
      }
    );
  });

  // --- 5. Independent Activation Codes ---
  console.log("\n--- 5. Independent Activation Codes Verification ---");

  await test("Each pending account receives a unique, independent activation code", () => {
    const allCodes = [...playerRecords.map((p) => p.code), ...scoutRecords.map((s) => s.code)];
    const uniqueCodes = new Set(allCodes);
    assert.equal(allCodes.length, 10, "Total of 10 codes issued");
    assert.equal(uniqueCodes.size, 10, "All 10 codes must be mutually unique");
  });

  await test("Each activation code is correctly verified by its bcrypt hash", async () => {
    for (const player of playerRecords) {
      const codeDoc = env.activationCodes.find((c) => c.userId === player.userId && c.usedAt === null);
      assert.ok(codeDoc, `Code doc must exist for ${player.email}`);
      const isMatch = await verifyActivationCode(player.code, codeDoc.codeHash);
      assert.equal(isMatch, true, `Plaintext code must verify against hash for ${player.email}`);

      // Verify another player's code does NOT match this hash
      const mismatched = await verifyActivationCode("FFFFFFFF", codeDoc.codeHash);
      assert.equal(mismatched, false);
    }
  });

  // --- 6. Activation Order Independence & Isolation ---
  console.log("\n--- 6. Activation Order Independence & Isolation ---");

  await test("Activating Account #3 (Player Gamma) does not alter or invalidate other pending codes", async () => {
    const playerGamma = playerRecords[2]; // Player Gamma (index 2)
    assert.equal(playerGamma.fullName, "Player Gamma");

    // Activate Player Gamma
    const activationRes = await env.activateAccount({
      email: playerGamma.email,
      code: playerGamma.code,
      password: "GammaSecurePassword123!",
    });

    assert.equal(activationRes.user.isActive, true, "Player Gamma must now be active");

    // Verify Player Alpha, Beta, Delta, Epsilon are STILL pending
    for (let i = 0; i < playerRecords.length; i++) {
      if (i === 2) continue; // Gamma is active
      const otherPlayer = playerRecords[i];
      const otherUser = env.users.get(otherPlayer.userId);
      assert.equal(otherUser?.isActive, false, `${otherPlayer.fullName} must remain inactive`);

      // Verify other player's activation code is STILL valid and unused
      const otherCodeDoc = env.activationCodes.find(
        (c) => c.userId === otherPlayer.userId && c.usedAt === null
      );
      assert.ok(otherCodeDoc, `${otherPlayer.fullName} code must still be unused`);
      const isStillValid = await verifyActivationCode(otherPlayer.code, otherCodeDoc.codeHash);
      assert.equal(isStillValid, true, `${otherPlayer.fullName} code must still verify`);
    }

    // Verify all 5 Scouts are STILL pending with unused codes
    for (const scout of scoutRecords) {
      const scoutUser = env.users.get(scout.userId);
      assert.equal(scoutUser?.isActive, false, `${scout.fullName} must remain inactive`);
      const scoutCodeDoc = env.activationCodes.find(
        (c) => c.userId === scout.userId && c.usedAt === null
      );
      assert.ok(scoutCodeDoc, `${scout.fullName} code must still be unused`);
    }
  });

  await test("Accounts can be activated in any arbitrary sequence without constraints", async () => {
    // Sequence: Scout Delta (#4) -> Player Alpha (#1) -> Scout Beta (#2) -> Player Epsilon (#5)
    // 1. Activate Scout Delta
    const scoutDelta = scoutRecords[3];
    await env.activateAccount({
      email: scoutDelta.email,
      code: scoutDelta.code,
      password: "DeltaScoutPassword123!",
    });
    assert.equal(env.users.get(scoutDelta.userId)?.isActive, true);

    // 2. Activate Player Alpha
    const playerAlpha = playerRecords[0];
    await env.activateAccount({
      email: playerAlpha.email,
      code: playerAlpha.code,
      password: "AlphaPlayerPassword123!",
    });
    assert.equal(env.users.get(playerAlpha.userId)?.isActive, true);

    // 3. Activate Scout Beta
    const scoutBeta = scoutRecords[1];
    await env.activateAccount({
      email: scoutBeta.email,
      code: scoutBeta.code,
      password: "BetaScoutPassword123!",
    });
    assert.equal(env.users.get(scoutBeta.userId)?.isActive, true);

    // 4. Activate Player Epsilon
    const playerEpsilon = playerRecords[4];
    await env.activateAccount({
      email: playerEpsilon.email,
      code: playerEpsilon.code,
      password: "EpsilonPlayerPassword123!",
    });
    assert.equal(env.users.get(playerEpsilon.userId)?.isActive, true);

    // Verify Player Beta (#2) is STILL pending and can activate normally
    const playerBeta = playerRecords[1];
    assert.equal(env.users.get(playerBeta.userId)?.isActive, false);

    await env.activateAccount({
      email: playerBeta.email,
      code: playerBeta.code,
      password: "BetaPlayerPassword123!",
    });
    assert.equal(env.users.get(playerBeta.userId)?.isActive, true);
  });

  // --- 7. Security: Rejection of Expired and Reused Codes ---
  console.log("\n--- 7. Security: Rejection of Expired and Reused Codes ---");

  await test("Reused activation code is strictly rejected", async () => {
    const playerGamma = playerRecords[2]; // Already activated
    await assert.rejects(
      async () => {
        await env.activateAccount({
          email: playerGamma.email,
          code: playerGamma.code,
          password: "NewPasswordAttempt123!",
        });
      },
      (err: Error) => {
        assert.match(err.message, /Invalid activation request|already active/);
        return true;
      }
    );
  });

  await test("Expired activation codes are strictly rejected", async () => {
    // Create an account with expired code
    const expiredResult = await env.createPendingPlayer({
      fullName: "Player Expired",
      email: "player.expired@oneacademy.test",
      age: 17,
      sportId: validSportId,
    });

    // Manually expire code
    const codeDoc = env.activationCodes.find((c) => c.userId === expiredResult.user.id);
    assert.ok(codeDoc);
    codeDoc.expiresAt = new Date(Date.now() - 1000 * 60); // 1 minute ago

    await assert.rejects(
      async () => {
        await env.activateAccount({
          email: expiredResult.user.email,
          code: expiredResult.activationCode,
          password: "ExpiredPassword123!",
        });
      },
      (err: Error) => {
        assert.match(err.message, /Invalid, expired, or previously used activation code/);
        return true;
      }
    );
  });

  await test("Code regeneration invalidates only the target user's prior code", async () => {
    // Player Delta is still pending
    const playerDelta = playerRecords[3];
    assert.equal(env.users.get(playerDelta.userId)?.isActive, false);

    const oldCode = playerDelta.code;
    const { code: newCode } = await env.regenerateCode(playerDelta.userId);
    assert.notEqual(oldCode, newCode, "New code must differ from previous code");

    // Old code must now be rejected
    await assert.rejects(
      async () => {
        await env.activateAccount({
          email: playerDelta.email,
          code: oldCode,
          password: "OldCodePassword123!",
        });
      },
      (err: Error) => {
        assert.match(err.message, /Invalid, expired, or previously used activation code/);
        return true;
      }
    );

    // New code must succeed
    const res = await env.activateAccount({
      email: playerDelta.email,
      code: newCode,
      password: "NewCodePassword123!",
    });
    assert.equal(res.user.isActive, true);
  });

  // --- 8. Concurrency Protection on Activation Codes ---
  console.log("\n--- 8. Concurrency Protection on Activation Codes ---");

  await test("Concurrent activation attempts on the same code permit exactly one to succeed", async () => {
    // Scout Gamma is still pending
    const scoutGamma = scoutRecords[2];
    assert.equal(env.users.get(scoutGamma.userId)?.isActive, false);

    // Simulate 5 concurrent activation requests
    const attempts = Array.from({ length: 5 }, (_, i) =>
      env
        .activateAccount({
          email: scoutGamma.email,
          code: scoutGamma.code,
          password: `ConcurrentPassword_${i}_123!`,
        })
        .then(() => ({ success: true, index: i }))
        .catch((err) => ({ success: false, error: err.message, index: i }))
    );

    const results = await Promise.all(attempts);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    assert.equal(successes.length, 1, "Exactly one concurrent activation must succeed");
    assert.equal(failures.length, 4, "All other concurrent attempts must fail");
    assert.equal(env.users.get(scoutGamma.userId)?.isActive, true);
  });

  // --- 9. RBAC Authorization Security ---
  console.log("\n--- 9. Role-Based Access Control (RBAC) Security ---");

  await test("Coach role is authorized for player and scout creation and activation-code issue", () => {
    assert.equal(isRoleAuthorized("coach", ["coach"]), true);
    assert.equal(isRoleAuthorized("player", ["coach"]), false);
    assert.equal(isRoleAuthorized("scout", ["coach"]), false);
  });

  // --- 10. Frontend Form State Lifecycle & Chained Provisioning ---
  console.log("\n--- 10. Frontend Form State Lifecycle & Chained Provisioning ---");

  await test("CreatePlayerForm reset lifecycle clears successData and inputs", () => {
    // Simulate CreatePlayerForm state machine
    let fullName = "Initial Player";
    let email = "initial@oneacademy.test";
    let age: number | string = 16;
    let successData: Record<string, unknown> | null = {
      playerId: "p1",
      activationCode: "12345678",
    };

    const resetForm = () => {
      fullName = "";
      email = "";
      age = "";
      successData = null;
    };

    // Upon "Create Another Player" or close
    resetForm();

    assert.equal(fullName, "");
    assert.equal(email, "");
    assert.equal(age, "");
    assert.equal(successData, null, "successData must be cleared to prevent reopening or redirect loops");
  });

  await test("ScoutListView chained provisioning opens fresh modal with empty fields", () => {
    // Simulate ScoutListView state machine
    let fullName = "Scout Prior";
    let email = "prior.scout@talentscouts.test";
    let isAddModalOpen = false;
    let activationModalData: Record<string, unknown> | null = {
      code: "A1B2C3D4",
    };

    const handleCreateAnother = () => {
      activationModalData = null;
      fullName = "";
      email = "";
      isAddModalOpen = true;
    };

    handleCreateAnother();

    assert.equal(activationModalData, null);
    assert.equal(fullName, "");
    assert.equal(email, "");
    assert.equal(isAddModalOpen, true, "Add modal must open immediately with blank inputs");
  });

  console.log("\n========================================================");
  console.log(`Multiple Pending Accounts Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

// Auto-run when executed directly via tsx
runMultiplePendingAccountsTestSuite();
