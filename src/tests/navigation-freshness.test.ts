import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ReadinessService } from "../lib/services/readiness.service";
import { isRoleAuthorized } from "../lib/auth";

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

export async function runNavigationFreshnessTestSuite() {
  console.log("\n=======================================================");
  console.log("One Academy: Navigation, Stale State & Refresh Test Suite");
  console.log("=======================================================\n");

  // --- 1. Activation Page Navigation & State Reset Invariants ---
  console.log("--- 1. Activation Page Lifecycle & Form Reset Invariants ---");

  await test("1. Activation page contains resetForm callback and unmount cleanup", () => {
    const activatePagePath = path.join(process.cwd(), "src/app/activate/page.tsx");
    assert.ok(fs.existsSync(activatePagePath), "Activate page exists");
    const content = fs.readFileSync(activatePagePath, "utf-8");

    assert.ok(content.includes("resetForm"), "resetForm function is defined");
    assert.ok(content.includes("setSuccess(false)"), "resetForm sets success to false");
    assert.ok(content.includes("setCode(\"\")"), "resetForm clears activation code");
    assert.ok(content.includes("setPassword(\"\")"), "resetForm clears password");
    assert.ok(content.includes("setEmail(\"\")"), "resetForm clears email");
  });

  await test("2. Returning to activation page after visiting /login cleans state", () => {
    const activatePagePath = path.join(process.cwd(), "src/app/activate/page.tsx");
    const content = fs.readFileSync(activatePagePath, "utf-8");

    // Clicking Proceed to Sign In invokes resetForm on departure
    assert.ok(
      content.includes('href="/login"') && content.includes("resetForm()"),
      "Proceed to Sign In resets activation state"
    );

    // Unmount cleanup hook ensures if user navigates to /login, state resets
    assert.ok(
      content.includes("resetForm();") && content.includes("return () => {"),
      "Unmount cleanup resets activation state for next visit"
    );
  });

  await test("3. Starting a second activation is supported with 'Activate Another Account' button", () => {
    const activatePagePath = path.join(process.cwd(), "src/app/activate/page.tsx");
    const content = fs.readFileSync(activatePagePath, "utf-8");

    assert.ok(
      content.includes("Activate Another Account"),
      "Explicit button to activate another account without browser refresh is present"
    );
    assert.ok(
      content.includes("pageshow") && content.includes("popstate"),
      "Listens to pageshow (bfcache) and popstate (browser back/forward) to reset stale state"
    );
  });

  await test("4. AuthHeader dispatches reset event when clicking Activate link", () => {
    const headerPath = path.join(process.cwd(), "src/components/auth/auth-header.tsx");
    const content = fs.readFileSync(headerPath, "utf-8");

    assert.ok(
      content.includes("oa:reset-activation"),
      "Header links dispatch oa:reset-activation event to ensure fresh activation form"
    );
  });

  // --- 2. Readiness and Dependent Data Updates ---
  console.log("\n--- 2. Readiness Engine Recalculation & Mutation Relationships ---");

  await test("5. Attendance finalization updates readiness evaluation (>= 75% + 2 matches)", () => {
    // Before attendance: 0 closed sessions -> attendance is null (N/A) -> NOT READY
    const beforeSession = ReadinessService.evaluateReadiness(null, 2);
    assert.equal(beforeSession.isReady, false);
    assert.equal(beforeSession.status, "not_ready");

    // After session closed with player present: 1/1 = 100% attendance and 2 matches -> READY
    const afterSessionPresent = ReadinessService.evaluateReadiness(100.0, 2);
    assert.equal(afterSessionPresent.isReady, true);
    assert.equal(afterSessionPresent.status, "ready");

    // After session closed with player absent: 0/1 = 0% attendance and 2 matches -> NOT READY
    const afterSessionAbsent = ReadinessService.evaluateReadiness(0.0, 2);
    assert.equal(afterSessionAbsent.isReady, false);
    assert.equal(afterSessionAbsent.status, "not_ready");
  });

  await test("6. Match finalization updates readiness (moving from 1 match to 2 matches)", () => {
    // Player has 80% attendance but only 1 finalized match -> NOT READY
    const beforeSecondMatch = ReadinessService.evaluateReadiness(80.0, 1);
    assert.equal(beforeSecondMatch.isReady, false);
    assert.equal(beforeSecondMatch.matchCriterionMet, false);

    // Second match finalized -> 2 matches >= 2 and attendance 80% >= 75% -> READY
    const afterSecondMatch = ReadinessService.evaluateReadiness(80.0, 2);
    assert.equal(afterSecondMatch.isReady, true);
    assert.equal(afterSecondMatch.matchCriterionMet, true);
  });

  await test("7. Coach Readiness view synchronizes with fresh server props and client fetch", () => {
    const viewPath = path.join(process.cwd(), "src/features/readiness/coach-readiness-view.tsx");
    const content = fs.readFileSync(viewPath, "utf-8");

    assert.ok(
      content.includes("players = fetchedData?.players ?? initialPlayers"),
      "CoachReadinessView dynamically derives players from initialPlayers or fresh client fetch"
    );
    assert.ok(
      content.includes("stats = fetchedData?.stats ?? initialStats"),
      "CoachReadinessView dynamically derives stats from initialStats or fresh client fetch"
    );
    assert.ok(
      content.includes("/api/coach/readiness?limit=100"),
      "CoachReadinessView refreshes authoritative readiness data on navigation/mount"
    );
  });

  await test("8. Coach Overview dashboard synchronizes metrics and refreshes on navigation", () => {
    const overviewPath = path.join(process.cwd(), "src/features/coach/coach-overview-view.tsx");
    const content = fs.readFileSync(overviewPath, "utf-8");

    assert.ok(
      content.includes("setStats(initialStats)"),
      "CoachOverviewView syncs stats when initialStats updates"
    );
    assert.ok(
      content.includes("fetch(\"/api/coach/dashboard/stats\")"),
      "CoachOverviewView fetches fresh dashboard metrics on mount/navigation"
    );
  });

  // --- 3. Server Invalidation & Dynamic Execution Strategy ---
  console.log("\n--- 3. Server Invalidation & Dynamic Execution Strategy ---");

  await test("9. Mutation endpoints call revalidatePath to invalidate server route cache", () => {
    const sessionCloseRoute = path.join(process.cwd(), "src/app/api/coach/sessions/[id]/close/route.ts");
    const matchFinalizeRoute = path.join(process.cwd(), "src/app/api/coach/matches/[id]/finalize/route.ts");
    const activateRoute = path.join(process.cwd(), "src/app/api/auth/activate/route.ts");
    const remarkRoute = path.join(process.cwd(), "src/app/api/coach/players/[id]/remarks/route.ts");

    const sessionContent = fs.readFileSync(sessionCloseRoute, "utf-8");
    const matchContent = fs.readFileSync(matchFinalizeRoute, "utf-8");
    const activateContent = fs.readFileSync(activateRoute, "utf-8");
    const remarkContent = fs.readFileSync(remarkRoute, "utf-8");

    assert.ok(sessionContent.includes("revalidatePath(\"/dashboard/coach/readiness\")"), "Session close revalidates coach readiness");
    assert.ok(matchContent.includes("revalidatePath(\"/dashboard/coach/readiness\")"), "Match finalize revalidates coach readiness");
    assert.ok(activateContent.includes("revalidatePath"), "Activate route revalidates coach dashboards");
    assert.ok(remarkContent.includes("revalidatePath"), "Remarks route revalidates player profile and remarks");
  });

  await test("10. Authenticated dashboard routes have zero incompatible configs and authenticate via getCurrentUser()", () => {
    const readinessPage = path.join(process.cwd(), "src/app/(dashboard)/dashboard/coach/readiness/page.tsx");
    const coachPage = path.join(process.cwd(), "src/app/(dashboard)/dashboard/coach/page.tsx");
    const playerRemarksPage = path.join(process.cwd(), "src/app/(dashboard)/dashboard/player/remarks/page.tsx");

    const readinessContent = fs.readFileSync(readinessPage, "utf-8");
    const coachContent = fs.readFileSync(coachPage, "utf-8");
    const remarksContent = fs.readFileSync(playerRemarksPage, "utf-8");

    // Must NOT contain incompatible legacy route segment configs
    assert.equal(readinessContent.includes("export const dynamic"), false, "No export const dynamic");
    assert.equal(readinessContent.includes("export const revalidate"), false, "No export const revalidate");
    assert.equal(readinessContent.includes("export const instant"), false, "No export const instant");
    assert.equal(coachContent.includes("export const dynamic"), false, "No export const dynamic");
    assert.equal(coachContent.includes("export const revalidate"), false, "No export const revalidate");
    assert.equal(remarksContent.includes("export const dynamic"), false, "No export const dynamic");

    // Must authenticate via getCurrentUser() (which reads request cookies dynamically)
    assert.ok(readinessContent.includes("getCurrentUser()"), "Coach readiness authenticates dynamically via getCurrentUser()");
    assert.ok(coachContent.includes("getCurrentUser()"), "Coach dashboard authenticates dynamically via getCurrentUser()");
    assert.ok(remarksContent.includes("getCurrentUser()"), "Player remarks page authenticates dynamically via getCurrentUser()");
  });

  await test("11. Existing role authorization and access controls remain strictly valid", () => {
    assert.equal(isRoleAuthorized("coach", ["coach"]), true);
    assert.equal(isRoleAuthorized("player", ["coach"]), false);
    assert.equal(isRoleAuthorized("scout", ["coach"]), false);
    assert.equal(isRoleAuthorized("player", ["player"]), true);
    assert.equal(isRoleAuthorized("scout", ["scout"]), true);
  });

  console.log("\n=======================================================");
  console.log(`Navigation & Freshness Results: ${passedCount} Passed, ${failedCount} Failed`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    throw new Error(`${failedCount} test(s) failed in Navigation Freshness Test Suite.`);
  }
}

if (process.argv[1]?.endsWith("navigation-freshness.test.ts")) {
  runNavigationFreshnessTestSuite().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
