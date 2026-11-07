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
    console.error(`    ${err instanceof Error ? err.message : err}`);
    failedCount++;
  }
}

async function runProductionFixesTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Production Runtime & Deprecation Fixes Suite");
  console.log("========================================================\n");

  const rootDir = process.cwd();

  // 1. Mongoose Deprecation Fix Verification
  console.log("--- 1. Mongoose findOneAndUpdate / returnDocument: 'after' Audit ---");

  await test("Zero occurrences of deprecated 'new: true' in application source code", () => {
    function walkDir(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const srcFiles = walkDir(path.join(rootDir, "src")).filter(
      (f) => !f.includes("/tests/")
    );
    const filesWithNewTrue: string[] = [];
    const targetPattern = new RegExp("new" + ":\\s*true");

    srcFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      if (targetPattern.test(content)) {
        filesWithNewTrue.push(path.relative(rootDir, file));
      }
    });

    assert.equal(
      filesWithNewTrue.length,
      0,
      `Found deprecated 'new: true' in: ${filesWithNewTrue.join(", ")}`
    );
  });

  await test("Mongoose services and rate limiter use returnDocument: 'after'", () => {
    const rateLimiter = fs.readFileSync(path.join(rootDir, "src/lib/auth/rate-limiter.ts"), "utf-8");
    assert.ok(
      rateLimiter.includes('returnDocument: "after"'),
      "Rate limiter must use returnDocument: 'after'"
    );

    const authService = fs.readFileSync(path.join(rootDir, "src/lib/services/auth.service.ts"), "utf-8");
    assert.ok(
      authService.includes('returnDocument: "after"'),
      "AuthService must use returnDocument: 'after'"
    );

    const scoutService = fs.readFileSync(path.join(rootDir, "src/lib/services/scout.service.ts"), "utf-8");
    assert.ok(
      scoutService.includes('returnDocument: "after"'),
      "ScoutService must use returnDocument: 'after'"
    );

    const sportService = fs.readFileSync(path.join(rootDir, "src/lib/services/sport.service.ts"), "utf-8");
    assert.ok(
      sportService.includes('returnDocument: "after"'),
      "SportService must use returnDocument: 'after'"
    );

    const playerService = fs.readFileSync(path.join(rootDir, "src/lib/services/player.service.ts"), "utf-8");
    assert.ok(
      playerService.includes('returnDocument: "after"'),
      "PlayerService must use returnDocument: 'after'"
    );

    const matchService = fs.readFileSync(path.join(rootDir, "src/lib/services/match.service.ts"), "utf-8");
    assert.ok(
      matchService.includes('returnDocument: "after"'),
      "MatchService must use returnDocument: 'after'"
    );

    const sessionService = fs.readFileSync(path.join(rootDir, "src/lib/services/session.service.ts"), "utf-8");
    assert.ok(
      sessionService.includes('returnDocument: "after"'),
      "SessionService must use returnDocument: 'after'"
    );
  });

  // 2. Next.js Suspense & Cache Components Boundaries
  console.log("\n--- 2. Next.js Suspense & Cache Components Boundaries ---");

  await test("Dashboard layout exists and wraps children in a React Suspense boundary", () => {
    const layoutPath = path.join(rootDir, "src/app/(dashboard)/layout.tsx");
    assert.ok(fs.existsSync(layoutPath), "src/app/(dashboard)/layout.tsx must exist");
    const content = fs.readFileSync(layoutPath, "utf-8");
    assert.ok(content.includes("<Suspense"), "Dashboard layout must include Suspense boundary");
    assert.ok(content.includes("DashboardLoading"), "Dashboard layout must use DashboardLoading fallback");
  });

  await test("Coach Dashboard Page isolates dynamic user session behind Suspense", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/(dashboard)/dashboard/coach/page.tsx"), "utf-8");
    assert.ok(content.includes("<Suspense"), "Must wrap content in Suspense");
    assert.ok(content.includes("fallback={<DashboardLoading"), "Must provide DashboardLoading fallback");
    assert.ok(content.includes("getCurrentUser()"), "Must preserve server-side authentication");
    assert.ok(content.includes('redirect("/login?role=coach")'), "Must enforce unauthenticated redirect");
    assert.ok(content.includes('redirect("/login?error=unauthorized_role")'), "Must enforce unauthorized redirect");
  });

  await test("Player Dashboard Page isolates dynamic user session behind Suspense", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/(dashboard)/dashboard/player/page.tsx"), "utf-8");
    assert.ok(content.includes("<Suspense"), "Must wrap content in Suspense");
    assert.ok(content.includes("fallback={<DashboardLoading"), "Must provide DashboardLoading fallback");
    assert.ok(content.includes("getCurrentUser()"), "Must preserve server-side authentication");
    assert.ok(content.includes('redirect("/login?role=player")'), "Must enforce unauthenticated redirect");
    assert.ok(content.includes('redirect("/login?error=unauthorized_role")'), "Must enforce unauthorized redirect");
  });

  await test("Scout Dashboard Page isolates dynamic user session behind Suspense", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/(dashboard)/dashboard/scout/page.tsx"), "utf-8");
    assert.ok(content.includes("<Suspense"), "Must wrap content in Suspense");
    assert.ok(content.includes("fallback={<DashboardLoading"), "Must provide DashboardLoading fallback");
    assert.ok(content.includes("getCurrentUser()"), "Must preserve server-side authentication");
    assert.ok(content.includes('redirect("/login?role=scout")'), "Must enforce unauthenticated redirect");
    assert.ok(content.includes('redirect("/login?error=unauthorized_role")'), "Must enforce unauthorized redirect");
  });

  await test("Dashboard Root Page isolates role redirect behind Suspense", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/(dashboard)/dashboard/page.tsx"), "utf-8");
    assert.ok(content.includes("<Suspense"), "Must wrap content in Suspense");
    assert.ok(content.includes("fallback={<DashboardLoading"), "Must provide DashboardLoading fallback");
  });

  await test("Protected Coach sub-pages isolate session access behind Suspense", () => {
    const pages = [
      "src/app/(dashboard)/dashboard/coach/players/page.tsx",
      "src/app/(dashboard)/dashboard/coach/players/new/page.tsx",
      "src/app/(dashboard)/dashboard/coach/players/[id]/page.tsx",
      "src/app/(dashboard)/dashboard/coach/sessions/page.tsx",
      "src/app/(dashboard)/dashboard/coach/sessions/new/page.tsx",
      "src/app/(dashboard)/dashboard/coach/sessions/[id]/page.tsx",
      "src/app/(dashboard)/dashboard/coach/matches/page.tsx",
      "src/app/(dashboard)/dashboard/coach/matches/new/page.tsx",
      "src/app/(dashboard)/dashboard/coach/matches/[id]/page.tsx",
      "src/app/(dashboard)/dashboard/coach/scouts/page.tsx",
      "src/app/(dashboard)/dashboard/coach/sports/page.tsx",
      "src/app/(dashboard)/dashboard/coach/readiness/page.tsx",
    ];

    pages.forEach((p) => {
      const content = fs.readFileSync(path.join(rootDir, p), "utf-8");
      assert.ok(content.includes("<Suspense"), `${p} must include Suspense`);
      assert.ok(content.includes("fallback={<DashboardLoading"), `${p} must use DashboardLoading fallback`);
    });
  });

  await test("Protected Player & Scout sub-pages isolate session access behind Suspense", () => {
    const pages = [
      "src/app/(dashboard)/dashboard/player/attendance/page.tsx",
      "src/app/(dashboard)/dashboard/player/matches/page.tsx",
      "src/app/(dashboard)/dashboard/player/profile/page.tsx",
      "src/app/(dashboard)/dashboard/player/remarks/page.tsx",
      "src/app/(dashboard)/dashboard/scout/discover/page.tsx",
      "src/app/(dashboard)/dashboard/scout/discover/[sportId]/page.tsx",
      "src/app/(dashboard)/dashboard/scout/players/[id]/page.tsx",
    ];

    pages.forEach((p) => {
      const content = fs.readFileSync(path.join(rootDir, p), "utf-8");
      assert.ok(content.includes("<Suspense"), `${p} must include Suspense`);
      assert.ok(content.includes("fallback={<DashboardLoading"), `${p} must use DashboardLoading fallback`);
    });
  });

  console.log("\n========================================================");
  console.log(`Production Fixes Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runProductionFixesTestSuite().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
