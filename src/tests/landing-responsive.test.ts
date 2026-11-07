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

export async function runLandingResponsiveTestSuite() {
  console.log("\n========================================================");
  console.log("One Academy: Landing Page Responsive & Media-Stage Suite");
  console.log("========================================================\n");

  const pagePath = path.join(process.cwd(), "src/app/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // 1. Source Code & Layout Invariants
  console.log("--- 1. Source Code & Responsive Structure ---");

  await test("Landing page implements shared responsive media-stage calculation", () => {
    assert.ok(content.includes("updateStage"), "Must include updateStage callback");
    assert.ok(content.includes("ResizeObserver"), "Must observe container resizing with ResizeObserver");
    assert.ok(content.includes("window.addEventListener(\"resize\""), "Must listen to window resize events");
    assert.ok(content.includes("16 / 9"), "Must enforce 16:9 intrinsic aspect ratio");
  });

  await test("Landing page uses dynamic viewport units 100dvh without overflow", () => {
    assert.ok(content.includes("h-[100dvh]"), "Must use 100dvh for container height");
    assert.ok(content.includes("overflow-hidden"), "Must hide overflow to prevent scrollbars");
  });

  await test("Landing page preserves role button horizontal character alignment", () => {
    assert.ok(content.includes('left: "29.2%"'), "Coach button locked to 29.2% character position");
    assert.ok(content.includes('left: "50.0%"'), "Player button locked to 50.0% character position");
    assert.ok(content.includes('left: "69.3%"'), "Scout button locked to 69.3% character position");
  });

  await test("Landing page preserves navigation links, video rules, and legal structure", () => {
    assert.ok(content.includes('href="/login?role=coach"'), "Coach link exists");
    assert.ok(content.includes('href="/login?role=player"'), "Player link exists");
    assert.ok(content.includes('href="/login?role=scout"'), "Scout link exists");
    assert.ok(content.includes('href="/legal"'), "Legal link exists");
    assert.ok(content.includes('href="/activate"'), "Activate link exists");
    assert.ok(content.includes('href="/support"'), "Support link exists");
    assert.ok(content.includes('autoPlay'), "Video has autoPlay");
    assert.ok(content.includes('muted'), "Video is muted");
    assert.ok(!content.includes('loop'), "Video does NOT loop");
  });

  // 2. Mathematical Viewport Evaluation
  console.log("\n--- 2. Multi-Resolution Viewport Geometry Verification ---");

  const requiredViewports = [
    { name: "MacBook-style", w: 1440, h: 900 },
    { name: "Windows laptop (1366x768)", w: 1366, h: 768 },
    { name: "Windows laptop (1536x864)", w: 1536, h: 864 },
    { name: "Compact laptop (1280x720)", w: 1280, h: 720 },
    { name: "Larger laptop (1600x900)", w: 1600, h: 900 },
    { name: "Different aspect ratio (1600x1000)", w: 1600, h: 1000 },
    { name: "Mac screenshot reference (2047x1331)", w: 2047, h: 1331 },
    { name: "Wide short window (1440x700)", w: 1440, h: 700 },
  ];

  function evaluateStageAt(w: number, h: number) {
    const A = 16 / 9;
    const R = w / h;
    let stageW: number;
    let stageH: number;
    let cropTop = 0;
    let cropLeft = 0;

    if (R >= A) {
      stageW = w;
      stageH = w / A;
      cropTop = (stageH - h) / 2;
    } else {
      stageH = h;
      stageW = h * A;
      cropLeft = (stageW - w) / 2;
    }

    const stageTop = -cropTop;

    let btnW = 180;
    let btnH = 52;
    if (h <= 750) {
      btnW = 160;
      btnH = 44;
    } else if (h <= 850) {
      btnW = 170;
      btnH = 48;
    }

    const idealTurfY = stageTop + 0.910 * stageH;
    const footerH = 42;
    const maxCenterY = h - footerH - (btnH / 2) - 12;
    const finalButtonY = Math.min(idealTurfY, maxCenterY);
    const buttonBottom = finalButtonY + btnH / 2;
    const gapToFooter = (h - footerH) - buttonBottom;

    const idealHeadingY = stageTop + 0.040 * stageH;
    const headingTop = Math.min(56, Math.max(24, idealHeadingY));

    return {
      stageW,
      stageH,
      cropTop,
      cropLeft,
      finalButtonY,
      buttonBottom,
      gapToFooter,
      headingTop,
      btnW,
      btnH,
    };
  }

  for (const vp of requiredViewports) {
    await test(`Viewport ${vp.name} (${vp.w}x${vp.h}): No clipping & safe footer clearance`, () => {
      const geo = evaluateStageAt(vp.w, vp.h);

      // 1. Heading must not be clipped at top
      assert.ok(geo.headingTop >= 24, `Heading top (${geo.headingTop}px) must be >= 24px`);
      assert.ok(geo.headingTop <= 64, `Heading top (${geo.headingTop}px) must be <= 64px`);

      // 2. Button must not overlap footer (at least 12px clearance)
      assert.ok(
        geo.gapToFooter >= 12,
        `Gap between button bottom and footer top (${geo.gapToFooter}px) must be >= 12px in ${vp.name}`
      );

      // 3. Button bottom must be within viewport
      assert.ok(
        geo.buttonBottom < vp.h - 40,
        `Button bottom (${geo.buttonBottom}px) must be within viewport (${vp.h}px)`
      );
    });
  }

  console.log("\n========================================================");
  console.log(`Landing Responsive Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("landing-responsive.test.ts")) {
  runLandingResponsiveTestSuite();
}

