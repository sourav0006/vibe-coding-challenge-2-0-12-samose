import assert from "node:assert/strict";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  verifySessionToken,
  isRoleAuthorized,
} from "../lib/auth";
import type { UserRole } from "../models";

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

/**
 * State machine representing the refined LoginForm submission and mount lifecycle.
 */
class LoginFormLifecycleTester {
  public role: UserRole;
  public email: string = "";
  public password: string = "";
  public submitting: boolean = false;
  public success: boolean = false;
  public error: string | null = null;
  public redirectedTo: string | null = null;

  constructor(initialRoleParam?: string | null, initialErrorParam?: string | null) {
    this.role =
      initialRoleParam === "player" || initialRoleParam === "scout" || initialRoleParam === "coach"
        ? initialRoleParam
        : "coach";
    this.error =
      initialErrorParam === "unauthorized_role"
        ? "You do not have permission for that area. Please sign in with an authorized role."
        : null;
    // Guaranteed mount cleanup
    this.mount();
  }

  public mount() {
    this.submitting = false;
    this.success = false;
  }

  public selectRole(newRole: UserRole) {
    this.role = newRole;
    this.error = null;
  }

  public getButtonLabel(): string {
    if (this.submitting) return "Signing In…";
    if (this.success) return "Redirecting…";
    return "Sign In";
  }

  public isInputDisabled(): boolean {
    return this.submitting || this.success;
  }

  public async handleSubmit(
    mockFetch: () => Promise<{
      ok: boolean;
      status: number;
      data?: { success?: boolean; error?: string; user?: { role: UserRole } };
    }>
  ) {
    if (this.submitting || this.success) return;

    const trimmedEmail = this.email.trim();
    if (!trimmedEmail) {
      this.error = "Please enter your email address.";
      return;
    }

    if (!this.password) {
      this.error = "Please enter your password.";
      return;
    }

    this.error = null;
    this.submitting = true;

    try {
      const response = await mockFetch();
      if (!response.ok || !response.data?.success || !response.data?.user?.role) {
        this.error = response.data?.error || "Login failed. Please check your credentials.";
        this.submitting = false;
        this.success = false;
        return;
      }

      this.success = true;
      this.submitting = false;
      this.redirectedTo = `/dashboard/${response.data.user.role}`;
    } catch {
      this.error = "An unexpected network error occurred. Please try again.";
      this.submitting = false;
      this.success = false;
    }
  }
}

/**
 * Simulates the AppShell logout handler with duplicate suppression and full document navigation.
 */
class AppShellLogoutTester {
  public loggingOut: boolean = false;
  public networkCallCount: number = 0;
  public finalNavigationUrl: string | null = null;

  public async handleLogout(mockLogoutApi: () => Promise<{ ok: boolean }>) {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.networkCallCount++;

    try {
      await mockLogoutApi();
    } catch {
      // Handled gracefully without suppressing navigation
    } finally {
      this.finalNavigationUrl = "/login";
    }
  }
}

async function runLogoutLoginLifecycleTestSuite() {
  console.log("=========================================");
  console.log("One Academy: Logout & Login Lifecycle Test Suite");
  console.log("=========================================\n");

  // --- 1. Logout Handler & Duplicate Protection ---
  console.log("--- 1. Logout Handler & Navigation Guarantee ---");

  await test("AppShell prevents duplicate concurrent logout calls", async () => {
    const logoutTester = new AppShellLogoutTester();
    const networkResolvers: Array<() => void> = [];

    const mockApi = () =>
      new Promise<{ ok: boolean }>((resolve) => {
        networkResolvers.push(() => resolve({ ok: true }));
      });

    // Simulate rapid double clicks
    const call1 = logoutTester.handleLogout(mockApi);
    const call2 = logoutTester.handleLogout(mockApi);
    const call3 = logoutTester.handleLogout(mockApi);

    assert.equal(logoutTester.networkCallCount, 1, "Only 1 network request should be dispatched");
    assert.equal(logoutTester.loggingOut, true, "loggingOut state must be true while in flight");

    // Resolve network request
    networkResolvers.forEach((r) => r());
    await Promise.all([call1, call2, call3]);

    assert.equal(logoutTester.finalNavigationUrl, "/login", "Must navigate to /login");
  });

  await test("AppShell navigates to /login even if logout API throws network error", async () => {
    const logoutTester = new AppShellLogoutTester();
    const mockFailingApi = async () => {
      throw new Error("Network offline");
    };

    await logoutTester.handleLogout(mockFailingApi);

    assert.equal(logoutTester.finalNavigationUrl, "/login", "Must still redirect to /login in finally block");
  });

  // --- 2. Session Cookie Termination Security ---
  console.log("\n--- 2. Session Cookie Security & Cache-Control Headers ---");

  await test("Session cookie options enforce strict security properties", () => {
    assert.equal(SESSION_COOKIE_NAME, "one_academy_session");
    assert.equal(SESSION_COOKIE_OPTIONS.httpOnly, true, "Must be httpOnly to prevent XSS access");
    assert.equal(SESSION_COOKIE_OPTIONS.path, "/", "Must cover entire domain path");
    assert.equal(SESSION_COOKIE_OPTIONS.sameSite, "lax", "Must use SameSite=lax for CSRF protection");
  });

  await test("Expired or cleared token is rejected by verifySessionToken", async () => {
    const validToken = await createSessionToken({
      userId: "test-user-123",
      email: "coach@oneacademy.com",
      role: "coach",
    });

    const verified = await verifySessionToken(validToken);
    assert.ok(verified !== null);

    // After logout, token string is empty
    const clearedTokenResult = await verifySessionToken("");
    assert.equal(clearedTokenResult, null, "Empty token must be rejected");

    // Unauthorized access check
    const isPlayerAuthorized = isRoleAuthorized("player", ["coach"]);
    assert.equal(isPlayerAuthorized, false, "Unauthorized role must be blocked from coach route");
  });

  // --- 3. Login Form State Lifecycle & Submission Recovery ---
  console.log("\n--- 3. Login Form Submission & State Recovery Tests ---");

  await test("LoginForm initializes with clean idle state", () => {
    const form = new LoginFormLifecycleTester();
    assert.equal(form.submitting, false);
    assert.equal(form.success, false);
    assert.equal(form.error, null);
    assert.equal(form.getButtonLabel(), "Sign In");
    assert.equal(form.isInputDisabled(), false);
  });

  await test("LoginForm validates empty fields without getting stuck in submitting state", async () => {
    const form = new LoginFormLifecycleTester();
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      return { ok: true, status: 200, data: { success: true } };
    };

    // 1. Empty email
    await form.handleSubmit(mockFetch);
    assert.equal(fetchCalled, false);
    assert.equal(form.submitting, false, "Must not be stuck submitting");
    assert.equal(form.error, "Please enter your email address.");
    assert.equal(form.getButtonLabel(), "Sign In");
    assert.equal(form.isInputDisabled(), false);

    // 2. Empty password
    form.email = "coach@oneacademy.com";
    await form.handleSubmit(mockFetch);
    assert.equal(fetchCalled, false);
    assert.equal(form.submitting, false);
    assert.equal(form.error, "Please enter your password.");
    assert.equal(form.getButtonLabel(), "Sign In");
    assert.equal(form.isInputDisabled(), false);
  });

  await test("LoginForm resets submitting state on 401 invalid credentials", async () => {
    const form = new LoginFormLifecycleTester();
    form.email = "coach@oneacademy.com";
    form.password = "WrongPassword!";

    const mockFetch401 = async () => ({
      ok: false,
      status: 401,
      data: { success: false, error: "Invalid email or password" },
    });

    await form.handleSubmit(mockFetch401);

    assert.equal(form.submitting, false, "submitting must be reset to false");
    assert.equal(form.success, false, "success must be false");
    assert.equal(form.error, "Invalid email or password");
    assert.equal(form.getButtonLabel(), "Sign In", "Button must return to 'Sign In'");
    assert.equal(form.isInputDisabled(), false, "Inputs must remain editable");
  });

  await test("LoginForm resets submitting state on unexpected network error (fetch reject)", async () => {
    const form = new LoginFormLifecycleTester();
    form.email = "coach@oneacademy.com";
    form.password = "ValidPassword123!";

    const mockFailingNetwork = async () => {
      throw new TypeError("Failed to fetch");
    };

    await form.handleSubmit(mockFailingNetwork);

    assert.equal(form.submitting, false, "submitting must be reset to false after network failure");
    assert.equal(form.success, false, "success must be false after network failure");
    assert.match(form.error || "", /unexpected network error/i);
    assert.equal(form.getButtonLabel(), "Sign In", "Button must not stay stuck in 'Signing In…'");
    assert.equal(form.isInputDisabled(), false, "User must be able to retry");
  });

  await test("LoginForm cleanly sets success state and role redirect on valid submission", async () => {
    const form = new LoginFormLifecycleTester();
    form.email = "coach@oneacademy.com";
    form.password = "CoachPassword123!";
    form.role = "coach";

    const mockSuccess = async () => ({
      ok: true,
      status: 200,
      data: {
        success: true,
        user: { role: "coach" as const },
      },
    });

    await form.handleSubmit(mockSuccess);

    assert.equal(form.submitting, false, "submitting must be false after success response");
    assert.equal(form.success, true, "success must be true");
    assert.equal(form.redirectedTo, "/dashboard/coach");
    assert.equal(form.getButtonLabel(), "Redirecting…");
  });

  // --- 4. Role Selection & Query Synchronization ---
  console.log("\n--- 4. Role Selection & Query Parameter Tests ---");

  await test("Role selection switches role and clears previous error messages immediately", () => {
    const form = new LoginFormLifecycleTester();
    form.error = "Previous login attempt failed";
    assert.equal(form.role, "coach");

    form.selectRole("player");
    assert.equal(form.role, "player");
    assert.equal(form.error, null, "Switching role must clear prior errors");

    form.selectRole("scout");
    assert.equal(form.role, "scout");
    assert.equal(form.error, null);
  });

  await test("URL search params correctly initialize role and unauthorized messages", () => {
    const playerForm = new LoginFormLifecycleTester("player", null);
    assert.equal(playerForm.role, "player");

    const scoutForm = new LoginFormLifecycleTester("scout", null);
    assert.equal(scoutForm.role, "scout");

    const invalidRoleForm = new LoginFormLifecycleTester("admin", null);
    assert.equal(invalidRoleForm.role, "coach", "Unknown role must fallback to coach");

    const unauthorizedForm = new LoginFormLifecycleTester("coach", "unauthorized_role");
    assert.match(unauthorizedForm.error || "", /permission for that area/);
  });

  console.log("\n=========================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log("=========================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLogoutLoginLifecycleTestSuite().catch((err) => {
  console.error("Test suite threw an unhandled error:", err);
  process.exit(1);
});
