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
  console.log("One Academy: Judge Login Credentials Display Suite");
  console.log("========================================================\n");

  const loginPagePath = path.resolve(process.cwd(), "src/app/login/page.tsx");
  const loginPageContent = fs.readFileSync(loginPagePath, "utf-8");

  // --- 1. Exact Credential Accuracy ---
  console.log("--- 1. Official Judge Credential Accuracy ---");

  await test("Coach credentials contain exact email and password", () => {
    assert.ok(loginPageContent.includes("coach@gmail.com"), "Coach email must be coach@gmail.com");
    assert.ok(loginPageContent.includes("Coach@456"), "Coach password must be Coach@456");
  });

  await test("Player credentials contain exact email and password", () => {
    assert.ok(loginPageContent.includes("sourav@gmail.com"), "Player email must be sourav@gmail.com");
    assert.ok(loginPageContent.includes("Sourav@123"), "Player password must be Sourav@123");
  });

  await test("Scout credentials contain exact email and password", () => {
    assert.ok(loginPageContent.includes("scout01@gmail.com"), "Scout email must be scout01@gmail.com");
    assert.ok(loginPageContent.includes("Scout01@123"), "Scout password must be Scout01@123");
  });

  // --- 2. Prominent Manual Entry Instructions ---
  console.log("\n--- 2. Instruction Banner & Usability ---");

  await test("Instruction prominently advises manual entry and warns against copy-pasting", () => {
    const requiredInstruction =
      "Please enter your credentials manually for the best experience. Avoid copy-pasting.";
    assert.ok(
      loginPageContent.includes(requiredInstruction),
      `Login page must include the verbatim instruction: "${requiredInstruction}"`
    );
  });

  // --- 3. Manual Entry & Anti-Autofill Attributes ---
  console.log("\n--- 3. Manual Entry Only & Anti-Autofill Attributes ---");

  await test("Form specifies autoComplete='off'", () => {
    assert.ok(
      loginPageContent.includes('autoComplete="off"'),
      "Form or email input must specify autoComplete='off'"
    );
  });

  await test("Email input uses autoComplete='off' and does not prefill values", () => {
    assert.ok(
      /id="ims-email"[^>]*autoComplete="off"/.test(loginPageContent) ||
      /autoComplete="off"[^>]*id="ims-email"/.test(loginPageContent),
      "Email input must use autoComplete='off'"
    );
    assert.ok(
      loginPageContent.includes('const [email, setEmail] = useState("");'),
      "Email input state must initialize empty"
    );
  });

  await test("Password input uses autoComplete='new-password' and does not prefill values", () => {
    assert.ok(
      loginPageContent.includes('autoComplete="new-password"'),
      "Password input must use autoComplete='new-password'"
    );
    assert.ok(
      loginPageContent.includes('const [password, setPassword] = useState("");'),
      "Password input state must initialize empty"
    );
  });

  await test("Inputs do not use readOnly workarounds", () => {
    assert.ok(
      !loginPageContent.includes("readOnly"),
      "Inputs must remain fully interactive without readOnly attributes"
    );
  });

  await test("No copy buttons or automated fill buttons are present", () => {
    assert.ok(
      !loginPageContent.includes("navigator.clipboard"),
      "Copy button functionality must not be present"
    );
    assert.ok(
      !loginPageContent.includes("copyToClipboard"),
      "Copy button handlers must not be present"
    );
    assert.ok(
      !loginPageContent.includes("autoFill") && !loginPageContent.includes("fillDemo"),
      "One-click demo autofill mechanisms must not be present"
    );
  });

  // --- 4. Role Display & Multi-Role Access ---
  console.log("\n--- 4. Role-Specific & All-Role Presentation ---");

  await test("Shows credentials for selected role and provides toggle to view all 3 roles", () => {
    assert.ok(
      loginPageContent.includes("DEMO_CREDENTIALS[role]"),
      "Must render dynamic credentials for the selected role"
    );
    assert.ok(
      loginPageContent.includes("viewAllCredentials"),
      "Must provide state to switch to all-role view"
    );
    assert.ok(
      loginPageContent.includes("View All 3 Roles"),
      "Must provide clear button/link to access all three roles"
    );
  });

  await test("When no role is selected (initialRole === null), provides access to all 3 roles", () => {
    assert.ok(
      loginPageContent.includes("initialRole: UserRole | null = hasRoleParam"),
      "Initial role must be null when no role query param is supplied"
    );
  });

  console.log("\n========================================================");
  console.log(`Judge Credentials Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

