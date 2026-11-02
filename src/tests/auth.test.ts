import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  generateActivationCode,
  hashActivationCode,
  verifyActivationCode,
  computeActivationExpiration,
  isRoleAuthorized,
  loginRateLimiter,
  activationRateLimiter,
} from "../lib/auth";

// Ensure test environment secret is configured
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long-key-12345";
}

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

async function runAuthTestSuite() {
  console.log("=========================================");
  console.log("One Academy: Phase 3 Authentication Test Suite");
  console.log("=========================================\n");

  // 1. Password Security Tests
  console.log("--- 1. Password Security & Bcrypt Tests ---");
  await test("hashPassword produces non-empty, salted bcrypt hash", async () => {
    const hash = await hashPassword("CoachPassword123!");
    assert.ok(hash.startsWith("$2"), "Hash must be a bcrypt hash string");
    assert.notEqual(hash, "CoachPassword123!", "Hash must never equal plaintext");
  });

  await test("verifyPassword returns true for matching password", async () => {
    const hash = await hashPassword("SecurePassword456!");
    const isMatch = await verifyPassword("SecurePassword456!", hash);
    assert.equal(isMatch, true);
  });

  await test("verifyPassword returns false for invalid password", async () => {
    const hash = await hashPassword("CorrectPassword!");
    const isMatch = await verifyPassword("WrongPassword!", hash);
    assert.equal(isMatch, false);
  });

  await test("hashPassword rejects empty passwords", async () => {
    await assert.rejects(async () => {
      await hashPassword("");
    }, /Password cannot be empty/);
  });

  // 2. JWT Session Token Security Tests
  console.log("\n--- 2. JWT Session & Jose Security Tests ---");
  await test("createSessionToken and verifySessionToken round-trip valid payload", async () => {
    const payload = {
      userId: "507f1f77bcf86cd799439011",
      email: "coach@oneacademy.com",
      role: "coach" as const,
    };
    const token = await createSessionToken(payload);
    assert.ok(token.length > 50, "Token must be a valid JWT string");

    const decoded = await verifySessionToken(token);
    assert.ok(decoded !== null, "Decoded token must not be null");
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.role, payload.role);
  });

  await test("verifySessionToken rejects tampered or invalid tokens", async () => {
    const decoded = await verifySessionToken("invalid.jwt.token-string");
    assert.equal(decoded, null, "Tampered token must return null");
  });

  await test("verifySessionToken rejects expired tokens", async () => {
    const payload = {
      userId: "507f1f77bcf86cd799439012",
      email: "player@oneacademy.com",
      role: "player" as const,
    };
    // Issue token expired 1 second ago
    const expiredToken = await createSessionToken(payload, "0s");
    // Brief sleep to guarantee expiration
    await new Promise((r) => setTimeout(r, 50));
    const decoded = await verifySessionToken(expiredToken);
    assert.equal(decoded, null, "Expired token must be rejected");
  });

  await test("JWT payload never contains passwordHash or codeHash", async () => {
    const payload = {
      userId: "507f1f77bcf86cd799439013",
      email: "scout@oneacademy.com",
      role: "scout" as const,
    };
    const token = await createSessionToken(payload);
    const parts = token.split(".");
    const decodedBody = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    assert.equal(decodedBody.passwordHash, undefined);
    assert.equal(decodedBody.codeHash, undefined);
    assert.equal(decodedBody.password, undefined);
  });

  // 3. Activation Code Security Tests
  console.log("\n--- 3. Activation Code Security Tests ---");
  await test("generateActivationCode produces uppercase 8-char hex code", () => {
    const code = generateActivationCode();
    assert.equal(code.length, 8);
    assert.match(code, /^[0-9A-F]{8}$/);
  });

  await test("hashActivationCode and verifyActivationCode match correctly", async () => {
    const code = generateActivationCode();
    const hash = await hashActivationCode(code);
    assert.ok(hash.startsWith("$2"), "Code hash must be salted bcrypt hash");

    const match = await verifyActivationCode(code, hash);
    assert.equal(match, true);

    const wrongMatch = await verifyActivationCode("INCORRECT", hash);
    assert.equal(wrongMatch, false);
  });

  await test("verifyActivationCode handles case-insensitivity gracefully", async () => {
    const code = "A3B9C1D2";
    const hash = await hashActivationCode(code);
    const lowerMatch = await verifyActivationCode("a3b9c1d2", hash);
    assert.equal(lowerMatch, true);
  });

  await test("computeActivationExpiration defaults to 24 hours in the future", () => {
    const now = new Date();
    const expiresAt = computeActivationExpiration(24);
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    assert.ok(diffHours >= 23.9 && diffHours <= 24.1);
  });

  // 4. Role Authorization & RBAC Matrix Tests
  console.log("\n--- 4. Role-Based Access Control (RBAC) Matrix Tests ---");
  await test("Coach role authorization checks", () => {
    assert.equal(isRoleAuthorized("coach", "coach"), true);
    assert.equal(isRoleAuthorized("coach", "player"), false);
    assert.equal(isRoleAuthorized("coach", "scout"), false);
    assert.equal(isRoleAuthorized("coach", ["coach", "player"]), true);
  });

  await test("Player attempting Scout or Coach access is rejected", () => {
    assert.equal(isRoleAuthorized("player", "scout"), false);
    assert.equal(isRoleAuthorized("player", "coach"), false);
    assert.equal(isRoleAuthorized("player", "player"), true);
  });

  await test("Scout attempting Player or Coach access is rejected", () => {
    assert.equal(isRoleAuthorized("scout", "coach"), false);
    assert.equal(isRoleAuthorized("scout", "player"), false);
    assert.equal(isRoleAuthorized("scout", "scout"), true);
  });

  // 5. Rate Limiting Tests
  console.log("\n--- 5. Rate Limiter Security Tests ---");
  await test("loginRateLimiter allows 5 requests and blocks 6th", () => {
    const testKey = `test-ip-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = loginRateLimiter.check(testKey);
      assert.equal(res.allowed, true, `Attempt ${i + 1} should be allowed`);
    }
    const blockedRes = loginRateLimiter.check(testKey);
    assert.equal(blockedRes.allowed, false, "6th attempt must be rate-limited");
    assert.ok(blockedRes.retryAfterSeconds > 0);

    // Reset works
    loginRateLimiter.reset(testKey);
    const afterReset = loginRateLimiter.check(testKey);
    assert.equal(afterReset.allowed, true, "Must be allowed after reset");
  });

  await test("activationRateLimiter blocks abusive activation attempts", () => {
    const testKey = `test-act-ip-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      assert.equal(activationRateLimiter.check(testKey).allowed, true);
    }
    assert.equal(activationRateLimiter.check(testKey).allowed, false);
  });

  // Final Test Report
  console.log("\n=========================================");
  console.log(`Test Execution Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=========================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAuthTestSuite();
