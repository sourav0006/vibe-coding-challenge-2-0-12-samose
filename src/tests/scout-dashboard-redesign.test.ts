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

export async function runScoutDashboardRefinementTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Scout Dashboard Refinement & Talent Discovery Test Suite");
  console.log("========================================================\n");

  // --- 1. Asset & Character Image Verification ---
  console.log("--- 1. Scout Character Image & Hero Ribbon Invariants ---");

  await test("Scout character image exists in public/images/scout-character.png", () => {
    const assetPath = path.join(process.cwd(), "public/images/scout-character.png");
    assert.equal(fs.existsSync(assetPath), true, "scout-character.png must exist in public/images/");
    const stat = fs.statSync(assetPath);
    assert.ok(stat.size > 50000, "Image must have valid non-trivial size");
  });

  await test("ScoutDiscoveryView renders scout character with object-fit contain and no overscaling", () => {
    const discoveryPath = path.join(process.cwd(), "src/features/readiness/scout-discovery-view.tsx");
    const content = fs.readFileSync(discoveryPath, "utf-8");

    assert.ok(content.includes("object-contain"), "Must use object-contain");
    assert.ok(!content.includes("object-cover"), "Must NOT use object-cover");
    assert.ok(!content.includes("w-[215%]"), "Must NOT scale image with w-[215%] which cut off binoculars");
    assert.ok(content.includes("scout-character.png"), "scout-character.png image referenced");
  });

  await test("ScoutDiscoveryView hero ribbon stays strictly on one line on desktop", () => {
    const discoveryPath = path.join(process.cwd(), "src/features/readiness/scout-discovery-view.tsx");
    const content = fs.readFileSync(discoveryPath, "utf-8");

    assert.ok(content.includes("whitespace-nowrap"), "Ribbon text must specify whitespace-nowrap");
    assert.ok(content.includes("TALENT SCOUTING • ONE ACADEMY"), "Ribbon text present");
    assert.ok(content.includes("font-barlow-condensed"), "Barlow Condensed typography applied to ribbon");
  });

  // --- 2. Scoreboard Cards Refinements ---
  console.log("\n--- 2. Scoreboard Cards Refinements ---");

  await test("Scoreboard cards display labels in uppercase and zero icons before numbers or labels", () => {
    const discoveryPath = path.join(process.cwd(), "src/features/readiness/scout-discovery-view.tsx");
    const content = fs.readFileSync(discoveryPath, "utf-8");

    // Must not pass icon props into ScoreboardCard
    assert.ok(!content.includes("<ScoreboardCard\n          icon="), "ScoreboardCard must not receive icon prop");
    assert.ok(!content.includes("icon="), "ScoreboardCard must not receive icon prop");

    assert.ok(content.includes('label="READY ATHLETES"'), "Card 1 label: READY ATHLETES");
    assert.ok(content.includes('label="AVAILABLE SPORTS"'), "Card 2 label: AVAILABLE SPORTS");
    assert.ok(content.includes('label="TOP RATED ATHLETE"'), "Card 3 label: TOP RATED ATHLETE");
    assert.ok(content.includes('label="SCOUTING READY"'), "Card 4 label: SCOUTING READY");
    assert.ok(content.includes('sublabel="HIGH POTENTIAL TALENT"'), "Card 4 sublabel: HIGH POTENTIAL TALENT");
    assert.ok(content.includes("isStatusCard"), "Card 4 uses responsive isStatusCard typography to prevent overflow");
  });

  // --- 3. AppShell Scout Navigation & Header Refinements ---
  console.log("\n--- 3. AppShell Scout Navigation & Header Refinements ---");

  await test("AppShell defines scoutNavItems with Overview and dedicated Talent Discovery route", () => {
    const appShellPath = path.join(process.cwd(), "src/components/layout/app-shell.tsx");
    const content = fs.readFileSync(appShellPath, "utf-8");

    assert.ok(content.includes("const scoutNavItems: NavItem[]"), "scoutNavItems explicitly defined");
    assert.ok(content.includes('label: "Overview"'), "Overview nav item exists");
    assert.ok(content.includes('href: "/dashboard/scout"'), "Overview href points to /dashboard/scout");
    assert.ok(content.includes('label: "Talent Discovery"'), "Talent Discovery nav item exists");
    assert.ok(content.includes('href: "/dashboard/scout/discover"'), "Talent Discovery href points to /dashboard/scout/discover");
    assert.ok(!content.includes('href: "/dashboard/scout#discover"'), "Old anchor #discover removed from navigation");
  });

  await test("Scout Portal header removes Search and Notification buttons while keeping Role Badge and Logout", () => {
    const appShellPath = path.join(process.cwd(), "src/components/layout/app-shell.tsx");
    const content = fs.readFileSync(appShellPath, "utf-8");

    // Extract scout layout block
    const scoutBlockStart = content.indexOf('if (user.role === "scout")');
    assert.ok(scoutBlockStart !== -1, "Scout role layout block must exist");
    const scoutBlock = content.slice(scoutBlockStart);

    // Scout header must not include search button or notifications button
    assert.ok(!scoutBlock.includes('title="Search athletes"'), "Search athletes removed from scout header");
    assert.ok(!scoutBlock.includes('title="Notifications"'), "Notifications removed from scout header");

    // Scout header retains badge and logout
    assert.ok(scoutBlock.includes("<span>SCOUT</span>"), "Scout badge retained");
    assert.ok(scoutBlock.includes("Log Out"), "Logout retained");
  });

  // --- 4. Dedicated Talent Discovery & Sport-Wise Routes ---
  console.log("\n--- 4. Dedicated Talent Discovery & Sport-Wise Routes ---");

  await test("Dedicated Talent Discovery view renders sport categories with counts and progress bars", () => {
    const discoveryViewPath = path.join(process.cwd(), "src/features/readiness/talent-discovery-view.tsx");
    assert.ok(fs.existsSync(discoveryViewPath), "talent-discovery-view.tsx exists");
    const content = fs.readFileSync(discoveryViewPath, "utf-8");

    assert.ok(content.includes("Talent Discovery"), "Talent Discovery main title present");
    assert.ok(content.includes("Official Academy Policy"), "Official policy banner present");
    assert.ok(content.includes("/dashboard/scout/discover/"), "Links to sport-specific discover route");
  });

  await test("Sport-Specific Talent Discovery view renders athlete cards and search filtering", () => {
    const sportViewPath = path.join(process.cwd(), "src/features/readiness/sport-talent-discovery-view.tsx");
    assert.ok(fs.existsSync(sportViewPath), "sport-talent-discovery-view.tsx exists");
    const content = fs.readFileSync(sportViewPath, "utf-8");

    assert.ok(content.includes("Back to All Sports"), "Back to All Sports navigation present");
    assert.ok(content.includes("Ready Athletes"), "Ready Athletes header present");
    assert.ok(content.includes("Search athlete in"), "Sport-specific search field present");
    assert.ok(content.includes("View Scouting Profile"), "View Scouting Profile link present");
    assert.ok(content.includes("/dashboard/scout/players/"), "Links to existing player dossier");
  });

  await test("Route files exist for /dashboard/scout/discover and /dashboard/scout/discover/[sportId]", () => {
    const discoverPage = path.join(process.cwd(), "src/app/(dashboard)/dashboard/scout/discover/page.tsx");
    const sportPage = path.join(process.cwd(), "src/app/(dashboard)/dashboard/scout/discover/[sportId]/page.tsx");

    assert.ok(fs.existsSync(discoverPage), "discover/page.tsx must exist");
    assert.ok(fs.existsSync(sportPage), "discover/[sportId]/page.tsx must exist");
  });

  // --- 5. Security & RBAC Invariants ---
  console.log("\n--- 5. Security & RBAC Invariants ---");

  await test("ReadinessService strictly filters readiness: only Attendance >= 75% AND Finalized Matches >= 2 are eligible", () => {
    // 1. Exactly 75% attendance and 2 matches -> READY
    const readyEval = ReadinessService.evaluateReadiness(75.0, 2);
    assert.equal(readyEval.isReady, true);
    assert.equal(readyEval.status, "ready");
    assert.equal(readyEval.attendanceCriterionMet, true);
    assert.equal(readyEval.matchCriterionMet, true);

    // 2. Below attendance threshold (74.9%) -> NOT READY
    const failedAttendance = ReadinessService.evaluateReadiness(74.9, 2);
    assert.equal(failedAttendance.isReady, false);
    assert.equal(failedAttendance.status, "not_ready");
    assert.equal(failedAttendance.attendanceCriterionMet, false);

    // 3. Below match threshold (1 match) -> NOT READY
    const failedMatches = ReadinessService.evaluateReadiness(85.0, 1);
    assert.equal(failedMatches.isReady, false);
    assert.equal(failedMatches.status, "not_ready");
    assert.equal(failedMatches.matchCriterionMet, false);

    // 4. Null attendance (N/A) -> NOT READY
    const nullAttendance = ReadinessService.evaluateReadiness(null, 5);
    assert.equal(nullAttendance.isReady, false);
    assert.equal(nullAttendance.status, "not_ready");
  });

  console.log(`\n========================================================`);
  console.log(`Scout Dashboard Refinement Tests Completed: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`========================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runScoutDashboardRefinementTestSuite().catch((err) => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
  });
}
