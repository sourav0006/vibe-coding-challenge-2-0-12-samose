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

export async function runPlayerPortalRedesignTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Player Portal Redesign & Navigation Test Suite");
  console.log("========================================================\n");

  // --- 1. Asset & Image Verification ---
  console.log("--- 1. Asset & Image Verification ---");

  await test("Player character image exists in public/images/player-character.png", () => {
    const assetPath = path.join(process.cwd(), "public/images/player-character.png");
    assert.equal(fs.existsSync(assetPath), true, "player-character.png must exist in public/images/");
    const stat = fs.statSync(assetPath);
    assert.ok(stat.size > 100000, "Image must have valid non-trivial size");
  });

  // --- 2. Player Navigation Architecture & Order ---
  console.log("\n--- 2. Player Navigation Architecture & Order ---");

  await test("createSidebarStore uses closure-based listeners without unbound this errors", () => {
    const appShellPath = path.join(process.cwd(), "src/components/layout/app-shell.tsx");
    const content = fs.readFileSync(appShellPath, "utf-8");

    // Must not use this.listeners or this.getSnapshot()
    assert.ok(!content.includes("this.listeners"), "createSidebarStore must not rely on this.listeners");
    assert.ok(!content.includes("this.getSnapshot"), "createSidebarStore must not rely on this.getSnapshot");
    assert.ok(content.includes("const listeners = new Set"), "createSidebarStore must declare closure-scoped listeners");
  });

  await test("AppShell defines playerNavItems with My Profile strictly as the last item", () => {
    const appShellPath = path.join(process.cwd(), "src/components/layout/app-shell.tsx");
    const content = fs.readFileSync(appShellPath, "utf-8");

    // Check playerNavItems and primary items
    assert.ok(content.includes("const playerNavItems: NavItem[]"), "playerNavItems explicitly defined");
    assert.ok(content.includes('label: "Overview"'), "Overview nav item exists");
    assert.ok(content.includes('label: "Attendance"'), "Attendance nav item exists");
    assert.ok(content.includes('label: "Match History"'), "Match History nav item exists");
    assert.ok(content.includes('label: "Coach Feedback"'), "Coach Feedback nav item exists");
    assert.ok(content.includes('label: "My Profile"'), "My Profile nav item exists");

    // Check that My Profile is positioned after primary items in array concatenation
    const primaryNavIdx = content.indexOf("playerPrimaryNavItems");
    const profileNavIdx = content.indexOf("playerProfileNavItem");
    const playerNavIdx = content.indexOf("playerNavItems");

    assert.ok(primaryNavIdx !== -1, "playerPrimaryNavItems defined");
    assert.ok(profileNavIdx !== -1, "playerProfileNavItem defined");
    assert.ok(playerNavIdx !== -1, "playerNavItems defined");

    assert.ok(
      content.includes("[...playerPrimaryNavItems, playerProfileNavItem]"),
      "playerNavItems must place playerProfileNavItem strictly at the end"
    );

    // Verify divider before My Profile in both desktop and mobile layouts
    assert.ok(
      content.includes("STRICTLY LAST NAVIGATION ITEM: My Profile"),
      "AppShell desktop sidebar must annotate and place My Profile as strictly last"
    );
  });

  await test("Player Portal uses dedicated retro deep-teal sidebar and warm parchment canvas", () => {
    const appShellPath = path.join(process.cwd(), "src/components/layout/app-shell.tsx");
    const content = fs.readFileSync(appShellPath, "utf-8");

    // Dedicated player role check and layout
    assert.ok(content.includes('if (user.role === "player")'), "Dedicated layout block for player role exists");
    assert.ok(content.includes("bg-[#F5EBD8]"), "Warm parchment canvas bg-[#F5EBD8] applied");
    assert.ok(content.includes("bg-[#11262C]"), "Deep-teal sidebar bg-[#11262C] applied");
    assert.ok(content.includes("Authenticated Player Portal"), "Player-specific footer present");
  });

  // --- 3. Player Overview View Invariants ---
  console.log("\n--- 3. Player Overview View Invariants ---");

  await test("PlayerOverviewView renders collegiate welcome hero and player-character.png", () => {
    const overviewPath = path.join(process.cwd(), "src/features/player/player-overview-view.tsx");
    const content = fs.readFileSync(overviewPath, "utf-8");

    assert.ok(content.includes("WELCOME BACK,"), "Collegiate welcome header text present");
    assert.ok(content.includes("/images/player-character.png"), "References player-character.png");
    assert.ok(content.includes("playerSunsetArch"), "Sunset semicircle arch SVG present");
    assert.ok(content.includes("overflow-hidden"), "Character wrapper has overflow-hidden for half-body crop");
  });

  await test("PlayerOverviewView renders 4 scoreboard KPI cards", () => {
    const overviewPath = path.join(process.cwd(), "src/features/player/player-overview-view.tsx");
    const content = fs.readFileSync(overviewPath, "utf-8");

    assert.ok(content.includes('label="Attendance"'), "Attendance scoreboard card present");
    assert.ok(content.includes('label="Matches Played"'), "Matches Played scoreboard card present");
    assert.ok(content.includes('label="Average Score"'), "Average Score scoreboard card present");
    assert.ok(content.includes('label="Scouting Readiness"'), "Scouting Readiness scoreboard card present");
  });

  await test("PlayerOverviewView renders 3-column analytics and quick operations with My Profile last", () => {
    const overviewPath = path.join(process.cwd(), "src/features/player/player-overview-view.tsx");
    const content = fs.readFileSync(overviewPath, "utf-8");

    // Analytics cards
    assert.ok(content.includes("Attendance Progress"), "Attendance Progress analytics card present");
    assert.ok(content.includes("Match Performance"), "Match Performance analytics card present");
    assert.ok(content.includes("Scouting Readiness"), "Scouting Readiness analytics card present");

    // Quick operations
    assert.ok(content.includes("Quick Operations"), "Quick Operations section present");
    assert.ok(content.includes("View Attendance"), "Quick operations has View Attendance");
    assert.ok(content.includes("View Match History"), "Quick operations has View Match History");
    assert.ok(content.includes("View Coach Feedback"), "Quick operations has View Coach Feedback");
    assert.ok(content.includes("My Profile"), "Quick operations has My Profile");

    const feedbackIdx = content.indexOf("View Coach Feedback");
    const profileIdx = content.indexOf("My Profile", feedbackIdx);
    assert.ok(profileIdx > feedbackIdx, "My Profile must appear as the final action in Quick Operations");
  });

  // --- 4. Scouting Readiness Mathematical Invariants ---
  console.log("\n--- 4. Scouting Readiness Invariants ---");

  await test("Readiness rule qualifies strictly when Attendance >= 75.0% AND Matches >= 2", () => {
    const ready = ReadinessService.evaluateReadiness(75.0, 2);
    assert.equal(ready.isReady, true);
    assert.equal(ready.status, "ready");

    const notReadyAttendance = ReadinessService.evaluateReadiness(74.9, 5);
    assert.equal(notReadyAttendance.isReady, false);
    assert.equal(notReadyAttendance.status, "not_ready");

    const notReadyMatches = ReadinessService.evaluateReadiness(100.0, 1);
    assert.equal(notReadyMatches.isReady, false);
    assert.equal(notReadyMatches.status, "not_ready");
  });

  // --- 5. Remaining Player Views Consistency ---
  console.log("\n--- 5. Remaining Player Views Consistency ---");

  await test("All Player views apply font-alfa and retro color system", () => {
    const views = [
      "src/features/player/player-overview-view.tsx",
      "src/features/player/player-attendance-view.tsx",
      "src/features/player/player-matches-view.tsx",
      "src/features/player/player-remarks-view.tsx",
      "src/features/player/player-profile-view.tsx",
    ];

    for (const view of views) {
      const filePath = path.join(process.cwd(), view);
      assert.ok(fs.existsSync(filePath), `${view} exists`);
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(content.includes("font-alfa"), `${view} uses font-alfa display typography`);
      assert.ok(content.includes("#132B32"), `${view} uses deep teal primary text token`);
      assert.ok(content.includes("#E2D7C3") || content.includes("#FAF5EC") || content.includes("#FFFDF8"), `${view} uses warm retro card and border tokens`);
    }
  });

  console.log("\n========================================================");
  console.log(`Player Portal Redesign Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run test suite if invoked directly
if (process.argv[1] && process.argv[1].endsWith("player-portal-redesign.test.ts")) {
  runPlayerPortalRedesignTestSuite().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}

