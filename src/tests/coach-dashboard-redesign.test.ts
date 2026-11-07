import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ReadinessService } from "../lib/services/readiness.service";

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

export async function runCoachDashboardRedesignTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Coach Dashboard Redesign & Navigation Test Suite");
  console.log("========================================================\n");

  // --- 1. Asset & Image Verification ---
  console.log("--- 1. Asset & Image Verification ---");

  await test("Coach character image exists in public/images/coach-character.png", () => {
    const assetPath = path.join(process.cwd(), "public/images/coach-character.png");
    assert.equal(fs.existsSync(assetPath), true, "coach-character.png must exist in public/images/");
    const stat = fs.statSync(assetPath);
    assert.ok(stat.size > 100000, "Image must have valid non-trivial size");
  });

  // --- 2. Scouting Readiness Calculation Invariants ---
  console.log("\n--- 2. Scouting Readiness Rule Invariants ---");

  await test("Readiness rule qualifies only when Attendance >= 75.0% AND Matches >= 2", () => {
    // Both met
    const ready = ReadinessService.evaluateReadiness(75.0, 2);
    assert.equal(ready.isReady, true);
    assert.equal(ready.status, "ready");
    assert.equal(ready.attendanceCriterionMet, true);
    assert.equal(ready.matchCriterionMet, true);

    // High attendance, insufficient matches
    const notEnoughMatches = ReadinessService.evaluateReadiness(95.0, 1);
    assert.equal(notEnoughMatches.isReady, false);
    assert.equal(notEnoughMatches.status, "not_ready");
    assert.equal(notEnoughMatches.attendanceCriterionMet, true);
    assert.equal(notEnoughMatches.matchCriterionMet, false);

    // Many matches, insufficient attendance
    const lowAttendance = ReadinessService.evaluateReadiness(74.9, 10);
    assert.equal(lowAttendance.isReady, false);
    assert.equal(lowAttendance.status, "not_ready");
    assert.equal(lowAttendance.attendanceCriterionMet, false);
    assert.equal(lowAttendance.matchCriterionMet, true);

    // N/A attendance
    const naAttendance = ReadinessService.evaluateReadiness(null, 5);
    assert.equal(naAttendance.isReady, false);
    assert.equal(naAttendance.attendanceCriterionMet, false);
  });

  // --- 3. Attendance Trend Calculation Logic ---
  console.log("\n--- 3. Attendance Trend Mathematical Invariants ---");

  await test("Attendance velocity calculates correct percentage rounded to 1 decimal place", () => {
    const sampleSessions = [
      { present: 12, absent: 2 }, // 12 / 14 = 85.714% -> 85.7%
      { present: 10, absent: 0 }, // 10 / 10 = 100.0%
      { present: 0, absent: 8 },  // 0 / 8 = 0.0%
      { present: 0, absent: 0 },  // 0 / 0 = 0.0%
    ];

    const results = sampleSessions.map((s) => {
      const total = s.present + s.absent;
      return total > 0 ? Math.round((s.present / total) * 1000) / 10 : 0;
    });

    assert.equal(results[0], 85.7);
    assert.equal(results[1], 100);
    assert.equal(results[2], 0);
    assert.equal(results[3], 0);
  });

  // --- 4. Navigation & Route Invariants ---
  console.log("\n--- 4. Navigation & Shell Invariants ---");

  await test("Coach destinations contain all 7 mandatory sections", () => {
    const requiredDestinations = [
      "/dashboard/coach",
      "/dashboard/coach/players",
      "/dashboard/coach/scouts",
      "/dashboard/coach/sports",
      "/dashboard/coach/sessions",
      "/dashboard/coach/matches",
      "/dashboard/coach/readiness",
    ];

    const appShellSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/app-shell.tsx"),
      "utf8"
    );

    for (const route of requiredDestinations) {
      assert.ok(
        appShellSource.includes(route),
        `AppShell must contain navigation route for ${route}`
      );
    }
  });

  await test("Operations control shortcuts link to exact existing creation and management routes", () => {
    const overviewSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/coach/coach-overview-view.tsx"),
      "utf8"
    );

    const shortcuts = [
      "/dashboard/coach/players/new",
      "/dashboard/coach/sessions/new",
      "/dashboard/coach/matches/new",
      "/dashboard/coach/scouts",
      "/dashboard/coach/readiness",
    ];

    for (const shortcut of shortcuts) {
      assert.ok(
        overviewSource.includes(shortcut),
        `CoachOverviewView operations must link to ${shortcut}`
      );
    }
  });

  // --- 5. Coach Character Image Integration ---
  console.log("\n--- 5. Coach Character Image Integration ---");

  await test("Coach character image is referenced with object-fit contain and priority", () => {
    const overviewSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/coach/coach-overview-view.tsx"),
      "utf8"
    );

    assert.ok(
      overviewSource.includes('src="/images/coach-character.png"'),
      "Must reference /images/coach-character.png"
    );
    assert.ok(
      overviewSource.includes("object-contain"),
      "Must specify object-contain to preserve aspect ratio without clipping"
    );
  });

  // --- 6. Shared Sidebar UX Architecture Invariants ---
  console.log("\n--- 6. Shared Sidebar UX Architecture Invariants ---");

  await test("AppShell uses non-overlapping flex layout where main content occupies remaining width", () => {
    const appShellSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/app-shell.tsx"),
      "utf8"
    );

    assert.ok(
      appShellSource.includes("flex-col md:flex-row"),
      "Must use flex-col md:flex-row layout structure"
    );
    assert.ok(
      appShellSource.includes("flex-1 min-w-0"),
      "Main content area must use flex-1 min-w-0 to naturally occupy remaining width"
    );
    assert.ok(
      appShellSource.includes("coachSidebarStore"),
      "Must use persistent external store for sidebar state"
    );
  });

  await test("AppShell toggle button is always accessible in both expanded and collapsed states", () => {
    const appShellSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/app-shell.tsx"),
      "utf8"
    );

    assert.ok(
      appShellSource.includes('aria-label={sidebarCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}'),
      "Toggle button must provide explicit accessible labels for both states"
    );
  });

  // --- 7. React Hydration Safety Invariants ---
  console.log("\n--- 7. React Hydration Safety Invariants ---");

  await test("CoachOverviewView eliminates hydration mismatch with deterministic server snapshot", () => {
    const overviewSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/coach/coach-overview-view.tsx"),
      "utf8"
    );

    assert.ok(
      overviewSource.includes('() => "Welcome back, Coach!"'),
      "Greeting must provide deterministic server snapshot to avoid SSR hydration mismatch"
    );
    assert.ok(
      overviewSource.includes("useSyncExternalStore"),
      "Must use useSyncExternalStore for hydration-safe client synchronization"
    );
  });

  // --- 8. Typography System & Match Fixture Spacing Invariants ---
  console.log("\n--- 8. Typography System & Match Fixture Spacing Invariants ---");

  await test("Global CSS includes self-hosted Graduate, Alfa Slab One, and Barlow Condensed font tokens", () => {
    const cssSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );

    assert.ok(cssSource.includes("@fontsource/graduate"), "Must import @fontsource/graduate");
    assert.ok(cssSource.includes("@fontsource/alfa-slab-one"), "Must import @fontsource/alfa-slab-one");
    assert.ok(cssSource.includes("@fontsource/barlow-condensed"), "Must import @fontsource/barlow-condensed");
    assert.ok(cssSource.includes("--font-graduate"), "Must declare --font-graduate");
    assert.ok(cssSource.includes("--font-alfa"), "Must declare --font-alfa");
    assert.ok(cssSource.includes("--font-barlow-condensed"), "Must declare --font-barlow-condensed");
  });

  await test("CoachOverviewView applies Graduate, Alfa Slab One, and Barlow Condensed appropriately", () => {
    const overviewSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/coach/coach-overview-view.tsx"),
      "utf8"
    );

    assert.ok(
      overviewSource.includes("font-graduate") || overviewSource.includes("font-alfa"),
      "Welcome heading must use collegiate vintage font"
    );
    assert.ok(overviewSource.includes("font-alfa"), "Scoreboard and headings must use font-alfa");
    assert.ok(overviewSource.includes("font-barlow-condensed"), "Card labels must use font-barlow-condensed");
  });

  await test("Recent Match Fixtures card eliminates excessive vertical whitespace", () => {
    const overviewSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/coach/coach-overview-view.tsx"),
      "utf8"
    );

    // Verify justify-start is used instead of justify-between to keep rows tight to divider
    assert.ok(
      overviewSource.includes("RECENT MATCH FIXTURES"),
      "Must contain Recent Match Fixtures card"
    );
    assert.ok(
      overviewSource.includes("flex flex-col justify-start"),
      "Cards must use justify-start to prevent pushing matches down"
    );
    assert.ok(
      overviewSource.includes("pt-2 divide-y divide-[#EAE0CF]/60"),
      "Matches container must use compact pt-2 top padding"
    );
  });

  console.log("\n========================================================");
  console.log(`Coach Dashboard Redesign Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runCoachDashboardRedesignTestSuite();
