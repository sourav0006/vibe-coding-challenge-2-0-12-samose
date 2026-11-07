import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

let passedCount = 0;
let failedCount = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("One Academy: Sidebar Overflow & Navigation Performance Suite");
  console.log("========================================================\n");

  const appShellPath = path.resolve(process.cwd(), "src/components/layout/app-shell.tsx");
  const appShellContent = fs.readFileSync(appShellPath, "utf-8");

  const playerListViewPath = path.resolve(process.cwd(), "src/features/coach/player-list-view.tsx");
  const playerListViewContent = fs.readFileSync(playerListViewPath, "utf-8");

  const coachOverviewViewPath = path.resolve(process.cwd(), "src/features/coach/coach-overview-view.tsx");
  const coachOverviewViewContent = fs.readFileSync(coachOverviewViewPath, "utf-8");

  const coachReadinessViewPath = path.resolve(process.cwd(), "src/features/readiness/coach-readiness-view.tsx");
  const coachReadinessViewContent = fs.readFileSync(coachReadinessViewPath, "utf-8");

  const playerDetailPagePath = path.resolve(process.cwd(), "src/app/(dashboard)/dashboard/coach/players/[id]/page.tsx");
  const playerDetailPageContent = fs.readFileSync(playerDetailPagePath, "utf-8");

  const sportServicePath = path.resolve(process.cwd(), "src/lib/services/sport.service.ts");
  const sportServiceContent = fs.readFileSync(sportServicePath, "utf-8");

  // --- 1. Sidebar Overflow & Width Constraints ---
  console.log("--- 1. Sidebar Overflow & Width Constraints ---");

  await test("AppShell enforces locked min-width and max-width when collapsed and expanded", () => {
    assert.ok(
      appShellContent.includes('sidebarCollapsed ? "w-20 min-w-20 max-w-20" : "w-64 min-w-64 max-w-64"'),
      "Sidebar must strictly constrain w-20 min-w-20 max-w-20 when collapsed to prevent layout stretching"
    );
  });

  await test("AppShell sidebar nav uses overflow-y-auto and overflow-x-hidden for Coach, Player, and Scout", () => {
    const navOverflowMatches = appShellContent.match(/overflow-y-auto overflow-x-hidden/g);
    assert.ok(navOverflowMatches && navOverflowMatches.length >= 3, "All role sidebars must set overflow-x-hidden on nav");
  });

  await test("AppShell sidebar tooltips use hidden group-hover:block to eliminate layout box overflow", () => {
    assert.ok(
      appShellContent.includes("hidden pointer-events-none group-hover:block"),
      "Tooltips must be hidden when unhovered to prevent horizontal scrollable geometry"
    );
  });

  await test("AppShell preserves accessible native title and aria-label on navigation links", () => {
    assert.ok(
      appShellContent.includes("title={sidebarCollapsed ? item.label : undefined}"),
      "Sidebar links must retain title attribute for native accessible tooltips"
    );
  });

  await test("AppShell main content containers prevent viewport horizontal overflow", () => {
    const mainMatches = appShellContent.match(/overflow-x-hidden/g);
    assert.ok(mainMatches && mainMatches.length >= 4, "Main layout content must prevent horizontal overflow");
  });

  // --- 2. Link Prefetching on Navigation Links ---
  console.log("\n--- 2. Route Link Prefetching ---");

  await test("AppShell sidebar nav links specify prefetch={true} for instant client navigation", () => {
    assert.ok(
      appShellContent.includes("prefetch={true}"),
      "AppShell sidebar nav links must enable Next.js prefetching"
    );
  });

  await test("CoachOverviewView quick operations and recent cards specify prefetch={true}", () => {
    assert.ok(
      /href="\/dashboard\/coach\/players"[\s\S]*?prefetch=\{true\}/.test(coachOverviewViewContent),
      "CoachOverviewView should prefetch players route"
    );
    assert.ok(
      /href="\/dashboard\/coach\/sessions"[\s\S]*?prefetch=\{true\}/.test(coachOverviewViewContent),
      "CoachOverviewView should prefetch sessions route"
    );
    assert.ok(
      /href="\/dashboard\/coach\/matches"[\s\S]*?prefetch=\{true\}/.test(coachOverviewViewContent),
      "CoachOverviewView should prefetch matches route"
    );
    assert.ok(
      /href="\/dashboard\/coach\/readiness"[\s\S]*?prefetch=\{true\}/.test(coachOverviewViewContent),
      "CoachOverviewView should prefetch readiness route"
    );
    assert.ok(
      /href="\/dashboard\/coach\/scouts"[\s\S]*?prefetch=\{true\}/.test(coachOverviewViewContent),
      "CoachOverviewView should prefetch scouts route"
    );
  });

  await test("PlayerListView row action buttons specify prefetch={true} for player profiles", () => {
    assert.ok(
      playerListViewContent.includes("prefetch={true}"),
      "PlayerListView row actions must prefetch player profiles"
    );
  });

  // --- 3. Redundant Fetch Elimination & Initial Mount Guards ---
  console.log("\n--- 3. Redundant Fetch Elimination ---");

  await test("PlayerListView uses isInitialMount guard to eliminate duplicate mount fetch", () => {
    assert.ok(
      playerListViewContent.includes("const isInitialMount = useRef(true);"),
      "PlayerListView must declare isInitialMount ref"
    );
    assert.ok(
      playerListViewContent.includes("initialPlayers !== null && search === \"\""),
      "PlayerListView must skip refetching if initialPlayers is provided"
    );
  });

  await test("CoachOverviewView uses isInitialMount guard to eliminate duplicate /api/coach/dashboard/stats fetch", () => {
    assert.ok(
      coachOverviewViewContent.includes("const isInitialMount = useRef(true);"),
      "CoachOverviewView must declare isInitialMount ref"
    );
    assert.ok(
      coachOverviewViewContent.includes("if (initialStats)"),
      "CoachOverviewView must skip duplicate mount fetch when initialStats is present"
    );
  });

  await test("CoachReadinessView uses isInitialMount guard to eliminate duplicate /api/coach/readiness fetch", () => {
    assert.ok(
      coachReadinessViewContent.includes("const isInitialMount = useRef(true);"),
      "CoachReadinessView must declare isInitialMount ref"
    );
    assert.ok(
      coachReadinessViewContent.includes("if (initialPlayers && initialPlayers.length > 0)"),
      "CoachReadinessView must skip duplicate mount fetch when initialPlayers is present"
    );
  });

  // --- 4. Service Query Optimizations ---
  console.log("\n--- 4. Service Query Optimizations ---");

  await test("SportService provides findAllSimple without expensive player lookup aggregation", () => {
    assert.ok(
      sportServiceContent.includes("static async findAllSimple()"),
      "SportService must provide lightweight findAllSimple"
    );
  });

  await test("Player Detail page uses SportService.findAllSimple for sports dropdown", () => {
    assert.ok(
      playerDetailPageContent.includes("SportService.findAllSimple()"),
      "Player detail page should use findAllSimple instead of findAllWithPlayerCounts"
    );
  });

  console.log("\n========================================================");
  console.log(`Sidebar & Performance Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
