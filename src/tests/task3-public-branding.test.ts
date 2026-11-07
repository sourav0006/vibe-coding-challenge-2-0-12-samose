import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SUPPORT_CONFIG,
  OFFICIAL_EMAILS,
  OFFICIAL_PHONES,
  OPERATING_HOURS,
} from "../config/support.config";

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

async function runTask3TestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Task 3 Legal, Support, Activation Help & Favicon Tests");
  console.log("========================================================\n");

  const rootDir = process.cwd();

  // 1. Combined Legal Page Tests
  console.log("--- 1. Combined Legal Page (Privacy Policy & Terms of Use) ---");

  await test("Legal page file exists and imports PublicShell", () => {
    const legalPath = path.join(rootDir, "src/app/legal/page.tsx");
    assert.ok(fs.existsSync(legalPath), "src/app/legal/page.tsx must exist");
    const content = fs.readFileSync(legalPath, "utf-8");
    assert.ok(content.includes("PublicShell"), "Must use PublicShell for retro theme consistency");
  });

  await test("Legal page supports segmented tab switching and direct link parameters", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/legal/page.tsx"), "utf-8");
    assert.ok(content.includes("useSearchParams"), "Must inspect searchParams for ?tab= parameter");
    assert.ok(content.includes("router.replace"), "Must allow updating URL without full page reload");
    assert.ok(content.includes('role="tab"'), "Must provide accessible tab elements");
    assert.ok(content.includes("Privacy Policy"), "Must contain Privacy Policy tab");
    assert.ok(content.includes("Terms of Use"), "Must contain Terms of Use tab");
  });

  await test("Privacy Policy covers required technical and data governance topics", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/legal/page.tsx"), "utf-8");
    assert.ok(content.includes("Information Collected"), "Must detail collected data");
    assert.ok(content.includes("salted bcrypt"), "Must detail password hashing security");
    assert.ok(content.includes("HTTP-only"), "Must detail secure JWT cookie protection");
    assert.ok(content.includes("Role-Based Access Control"), "Must detail Coach/Player/Scout RBAC isolation");
    assert.ok(content.includes("MongoDB Atlas"), "Must state database infrastructure");
    assert.ok(content.includes("sliding-window rate limiters"), "Must state brute-force rate-limiting defense");
    assert.ok(content.includes("effectiveFrom"), "Must state historical sport transfer dates");
  });

  await test("Terms of Use covers acceptable use, immutability, and role responsibilities", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/legal/page.tsx"), "utf-8");
    assert.ok(content.includes("Platform Purpose"), "Must outline acceptable use");
    assert.ok(content.includes("Account Eligibility"), "Must outline coach-controlled creation");
    assert.ok(content.includes("Finalized Fixtures"), "Must state fixture score immutability");
    assert.ok(content.includes("Closed Practice Sessions"), "Must state closed session immutability");
    assert.ok(content.includes("Intellectual Property"), "Must state content ownership");
  });

  await test("Legal page displays responsible draft advisory", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/legal/page.tsx"), "utf-8");
    assert.ok(content.includes("Important Advisory"), "Must clarify that policy is a responsible initial draft");
  });

  await test("Legal page renders verified contact emails and operating schedules", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/legal/page.tsx"), "utf-8");
    assert.ok(content.includes("OFFICIAL_EMAILS"), "Must reference official emails");
    assert.ok(content.includes("OFFICIAL_PHONES"), "Must reference official phones");
    assert.ok(content.includes("OPERATING_HOURS"), "Must state operating schedules");
    assert.ok(OFFICIAL_EMAILS.includes("souravn0612@gmail.com"), "Official email is configured");
    assert.ok(OFFICIAL_EMAILS.includes("alokrai0327@gmail.com"), "Official email is configured");
    assert.ok(OFFICIAL_PHONES.includes("+91 7480926552"), "Official phone is configured");
    assert.ok(OFFICIAL_PHONES.includes("+91 9025712162"), "Official phone is configured");
  });

  // 2. Contact & Support Page Tests
  console.log("\n--- 2. Contact & Support Page & Centralized Config ---");

  await test("Centralized support config defines official emails, phones, and operating schedules", () => {
    assert.ok(SUPPORT_CONFIG.generalEnquiries, "General enquiries config exists");
    assert.ok(SUPPORT_CONFIG.technicalSupport, "Technical support config exists");
    assert.ok(SUPPORT_CONFIG.activationHelp, "Activation help config exists");
    assert.ok(SUPPORT_CONFIG.accountAccess, "Account access config exists");
    assert.ok(SUPPORT_CONFIG.privacyRequests, "Privacy requests config exists");
    assert.ok(SUPPORT_CONFIG.academyAdministration, "Academy administration config exists");

    // Official emails and phones
    assert.deepEqual(
      OFFICIAL_EMAILS,
      ["souravn0612@gmail.com", "alokrai0327@gmail.com"],
      "Official emails match specification"
    );
    assert.deepEqual(
      OFFICIAL_PHONES,
      ["+91 7480926552", "+91 9025712162"],
      "Official phones match specification"
    );

    // Operating schedules
    assert.equal(
      OPERATING_HOURS.academy.schedule,
      "Monday to Sunday: 7:00 AM – 8:00 PM IST",
      "Academy hours match specification"
    );
    assert.equal(
      OPERATING_HOURS.support.schedule,
      "Monday to Saturday: 9:00 AM – 6:00 PM IST",
      "Support availability matches specification"
    );

    // No pending placeholders or old email in config
    const configString = JSON.stringify(SUPPORT_CONFIG);
    assert.ok(
      !configString.includes("Pending Configuration"),
      "Config must not contain 'Pending Configuration' placeholders"
    );
    assert.ok(
      !configString.includes("coach@gmail.com"),
      "Config must not contain old 'coach@gmail.com' address"
    );
  });

  await test("Support page renders 6 structured channels with clickable mailto: and tel: links", () => {
    const supportPath = path.join(rootDir, "src/app/support/page.tsx");
    assert.ok(fs.existsSync(supportPath), "src/app/support/page.tsx must exist");
    const content = fs.readFileSync(supportPath, "utf-8");
    assert.ok(content.includes("Official Academy Contact Directory"));
    assert.ok(content.includes("/activate/help"), "Must link to activation help guide");
    assert.ok(content.includes("/login"), "Must link to sign in");
    assert.ok(content.includes("href={`mailto:${email}`}"), "Must render mailto: links");
    assert.ok(content.includes("href={`tel:"), "Must render tel: links");
    assert.ok(!content.includes("Notice to Academy Administration:"), "Must not display pending notice box");
    assert.ok(content.includes("OPERATING_HOURS"), "Must display operating schedules");
  });

  // 3. Account Activation Help Page Tests
  console.log("\n--- 3. Account Activation Help Page ---");

  await test("Activation Help page exists and outlines the 7-step activation workflow", () => {
    const helpPath = path.join(rootDir, "src/app/activate/help/page.tsx");
    assert.ok(fs.existsSync(helpPath), "src/app/activate/help/page.tsx must exist");
    const content = fs.readFileSync(helpPath, "utf-8");
    assert.ok(content.includes("The 7-Step Activation Flow"));
    assert.ok(content.includes("Why an Activation Code is Required"));
    assert.ok(content.includes("8-Character Activation Code"));
    assert.ok(content.includes("24 hours"));
    assert.ok(content.includes("Go to Activation Page"));
  });

  await test("Activation Help page covers troubleshooting: expired codes, wrong emails, rate limits", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/activate/help/page.tsx"), "utf-8");
    assert.ok(content.includes("Troubleshooting Activation Issues"));
    assert.ok(content.includes("Invalid, expired, or previously used"));
    assert.ok(content.includes("Entering the wrong email address"));
    assert.ok(content.includes("2-minute cooldown"));
    assert.ok(content.includes("Selecting the wrong portal role"));
  });

  await test("Activation Help page renders verified support emails, phones, and hours", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/activate/help/page.tsx"), "utf-8");
    assert.ok(content.includes("OFFICIAL_EMAILS"), "Must reference OFFICIAL_EMAILS");
    assert.ok(content.includes("OFFICIAL_PHONES"), "Must reference OFFICIAL_PHONES");
    assert.ok(content.includes("OPERATING_HOURS"), "Must display support availability hours");
  });

  // 4. Navigation Placement & Entry Points Tests
  console.log("\n--- 4. Navigation Placement & Entry Points ---");

  await test("Landing page header DOES NOT contain top-right Support button", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf-8");
    const headerMatch = content.match(/<header[\s\S]*?<\/header>/);
    assert.ok(headerMatch, "Landing page header must exist");
    const headerContent = headerMatch[0];
    assert.ok(
      !headerContent.includes('href="/support"') && !headerContent.toLowerCase().includes("support"),
      "Landing page header must NOT contain a Support button/link"
    );
  });

  await test("Landing page places Privacy & Terms immediately to the LEFT of Activate Account", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf-8");
    const legalIdx = content.indexOf('href="/legal"');
    const activateIdx = content.indexOf('href="/activate"');
    assert.ok(legalIdx !== -1, "Privacy & Terms link must exist on landing page");
    assert.ok(activateIdx !== -1, "Activate Account link must exist on landing page");
    assert.ok(
      legalIdx < activateIdx,
      "Privacy & Terms must appear immediately to the LEFT of Activate Account in source"
    );
  });

  await test("Landing page footer contains visible Contact & Support link navigating to /support", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf-8");
    const footerMatch = content.match(/<footer[\s\S]*?<\/footer>/);
    assert.ok(footerMatch, "Landing page footer must exist");
    const footerContent = footerMatch[0];
    assert.ok(footerContent.includes('href="/support"'), "Footer must link to /support");
  });

  await test("Sign-in page contains visible Contact & Support link navigating to /support", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/app/login/page.tsx"), "utf-8");
    assert.ok(content.includes('href="/support"'), "Sign-in page must link to /support");
  });

  await test("Account Activation page footer contains Account Activation Help link", () => {
    const content = fs.readFileSync(path.join(rootDir, "src/components/auth/auth-layout.tsx"), "utf-8");
    assert.ok(
      content.includes('href="/activate/help"'),
      "AuthLayout must link to /activate/help on activate page"
    );
    assert.ok(
      content.includes("Account Activation Help"),
      "Footer must render 'Account Activation Help' link"
    );
    assert.ok(
      content.includes("One Academy &bull; Single-Academy Sports Management System"),
      "Footer text must be preserved"
    );
  });

  // 5. Favicon & Browser Branding Tests
  console.log("\n--- 5. Favicon & Browser Branding ---");

  await test("Official One Academy favicon.ico exists in src/app and public/", () => {
    assert.ok(fs.existsSync(path.join(rootDir, "src/app/favicon.ico")), "src/app/favicon.ico exists");
    assert.ok(fs.existsSync(path.join(rootDir, "public/favicon.ico")), "public/favicon.ico exists");

    const stat = fs.statSync(path.join(rootDir, "src/app/favicon.ico"));
    // Standard 32x32 ICO is ~4.2KB, whereas old default Next.js ICO was 15KB
    assert.ok(stat.size > 0 && stat.size < 10000, "Must be valid custom One Academy 32x32 ICO");
  });

  await test("PNG icon and Apple Touch Icon exist in src/app/ and public/", () => {
    assert.ok(fs.existsSync(path.join(rootDir, "src/app/icon.png")), "src/app/icon.png exists");
    assert.ok(fs.existsSync(path.join(rootDir, "src/app/apple-icon.png")), "src/app/apple-icon.png exists");
  });

  await test("Root layout metadata defines comprehensive icon references and brand theme color", () => {
    const layout = fs.readFileSync(path.join(rootDir, "src/app/layout.tsx"), "utf-8");
    assert.ok(layout.includes("/favicon.ico"), "Metadata must reference /favicon.ico");
    assert.ok(layout.includes("/icon.png"), "Metadata must reference /icon.png");
    assert.ok(layout.includes("/apple-icon.png"), "Metadata must reference /apple-icon.png");
    assert.ok(layout.includes('themeColor: "#11262C"'), "themeColor must use retro deep-navy #11262C");
  });

  await test("Next.js devIndicators is explicitly set to false in next.config.ts", () => {
    const config = fs.readFileSync(path.join(rootDir, "next.config.ts"), "utf-8");
    assert.ok(config.includes("devIndicators: false"), "next.config.ts must disable devIndicators");
  });

  console.log("\n========================================================");
  console.log(`Task 3 Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTask3TestSuite().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
