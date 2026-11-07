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

export async function runAuthRedesignTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Login & Activation Redesign Test Suite");
  console.log("========================================================\n");

  // --- 1. Background Scene and Mascot Assets ---
  console.log("--- 1. Background Scene & Mascot Assets ---");

  await test("Campus background asset exists in public/images/auth-background.png", () => {
    const assetPath = path.join(process.cwd(), "public/images/auth-background.png");
    assert.equal(fs.existsSync(assetPath), true, "auth-background.png must exist in public/images/");
    const stat = fs.statSync(assetPath);
    assert.ok(stat.size > 50000, "Background image must have non-trivial size");
  });

  await test("Fox 3D model and fallback poster are preserved in public/", () => {
    const modelPath = path.join(process.cwd(), "public/models/pulse-fox.glb");
    const posterPath = path.join(process.cwd(), "public/images/pulse-fox-poster.webp");
    assert.equal(fs.existsSync(modelPath), true, "pulse-fox.glb must exist in public/models/");
    assert.equal(fs.existsSync(posterPath), true, "pulse-fox-poster.webp must exist in public/images/");
  });

  // --- 2. Auth Header Navigation ---
  console.log("\n--- 2. Auth Header Navigation ---");

  await test("AuthHeader renders logo, wordmark, and role-appropriate actions", () => {
    const headerPath = path.join(process.cwd(), "src/components/auth/auth-header.tsx");
    assert.equal(fs.existsSync(headerPath), true, "auth-header.tsx must exist");
    const content = fs.readFileSync(headerPath, "utf-8");

    assert.ok(content.includes("<Logo"), "Header renders One Academy logo");
    assert.ok(content.includes('href="/activate"'), "Header links to activate");
    assert.ok(content.includes('href="/login"'), "Header links to login");
    assert.ok(content.includes("bg-[#8B1E1E]"), "Header uses red pill for active action");
  });

  // --- 3. Auth Layout Composition ---
  console.log("\n--- 3. Auth Layout Composition ---");

  await test("AuthLayout provides warm parchment canvas and layered campus scene", () => {
    const layoutPath = path.join(process.cwd(), "src/components/auth/auth-layout.tsx");
    assert.equal(fs.existsSync(layoutPath), true, "auth-layout.tsx must exist");
    const content = fs.readFileSync(layoutPath, "utf-8");

    assert.ok(content.includes("bg-[#F4EBD8]"), "Warm parchment background #F4EBD8 applied");
    assert.ok(content.includes("auth-background.png"), "Campus background image referenced");
    assert.ok(content.includes("grid-cols-1 lg:grid-cols-12"), "2-column layout for desktop");
  });

  // --- 4. Login Page Invariants ---
  console.log("\n--- 4. Login Page Invariants ---");

  await test("LoginPage incorporates double gold border, role tabs, and deep teal button", () => {
    const loginPath = path.join(process.cwd(), "src/app/login/page.tsx");
    const content = fs.readFileSync(loginPath, "utf-8");

    assert.ok(content.includes("Sign In"), "Sign In heading present");
    assert.ok(content.includes("Select Portal Role"), "Role selector present");
    assert.ok(content.includes("Coach"), "Coach role option present");
    assert.ok(content.includes("Player"), "Player role option present");
    assert.ok(content.includes("Scout"), "Scout role option present");
    assert.ok(content.includes("name@oneacademy.com"), "Email placeholder present");
    assert.ok(content.includes("Sign In →"), "Vintage Sign In submit label present");
    assert.ok(content.includes("/activate"), "Link to activation present");
    assert.ok(!content.includes("<Navbar"), "Old generic Navbar removed");
    assert.ok(!content.includes("<Footer"), "Old generic Footer removed");
  });

  // --- 5. Activation Page Invariants ---
  console.log("\n--- 5. Activation Page Invariants ---");

  await test("ActivatePage incorporates 8-char segmented code, password toggle, and deep teal button", () => {
    const activatePath = path.join(process.cwd(), "src/app/activate/page.tsx");
    const content = fs.readFileSync(activatePath, "utf-8");

    assert.ok(content.includes("Activate Your Account"), "Activate heading present");
    assert.ok(content.includes("Registered Email Address"), "Registered email field present");
    assert.ok(content.includes("Single-Use Activation Code"), "Activation code field present");
    assert.ok(content.includes("SegmentedActivationCodeInput"), "Segmented input component retained");
    assert.ok(content.includes("Activate Account →"), "Vintage Activate Account submit label present");
    assert.ok(content.includes("/login"), "Link to login present");
    assert.ok(!content.includes("<Navbar"), "Old generic Navbar removed");
    assert.ok(!content.includes("<Footer"), "Old generic Footer removed");
  });

  // --- 6. Fox Mascot CSS Palette Invariants ---
  console.log("\n--- 6. Fox Mascot CSS Palette Invariants ---");

  await test("fox-mascot.css uses Retro / Vintage Sports Club tokens and eliminates green buttons", () => {
    const cssPath = path.join(process.cwd(), "src/components/mascot/fox-mascot.css");
    const content = fs.readFileSync(cssPath, "utf-8");

    assert.ok(content.includes("#C58A2B"), "Muted gold border #C58A2B applied");
    assert.ok(content.includes("#11262C"), "Deep teal/navy #11262C applied");
    assert.ok(!content.includes("#15803d"), "Green #15803d removed from primary tokens");
    assert.ok(!content.includes("linear-gradient(145deg, #dcfce7, #dbeafe)"), "Blue/green blobs removed");
  });

  console.log(`\n========================================================`);
  console.log(`Auth Redesign Tests Completed: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`========================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAuthRedesignTestSuite().catch((err) => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
  });
}

