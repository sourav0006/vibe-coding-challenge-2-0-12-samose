import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Types } from "mongoose";
import { connectToDatabase } from "../lib/db";
import {
  SportModel,
  PlayerModel,
  UserModel,
  CoachRemarkModel,
} from "../models";
import { PlayerPortalService } from "../lib/services/player-portal.service";
import { RemarkService } from "../lib/services/remark.service";

async function runPlayerRemarksLiveDbTests() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 9 Live MongoDB Atlas Integration Tests");
  console.log("=======================================================\n");

  await connectToDatabase();
  console.log("✓ Connected to MongoDB Atlas successfully");

  // 1. Fetch active sport
  const sport = await SportModel.findOne({ isActive: true }).exec();
  assert.ok(sport, "At least one active sport must exist in MongoDB Atlas");
  console.log(`✓ Active sport retrieved: "${sport.name}"`);

  // 2. Create test user and player
  const ts = Date.now();
  const testUser = await UserModel.create({
    email: `player_portal_test_${ts}@test.com`,
    passwordHash: "dummy_hashed_secret",
    role: "player",
    isActive: true,
  });

  const testPlayer = await PlayerModel.create({
    userId: testUser._id,
    fullName: `Portal Test Athlete ${ts}`,
    age: 18,
    sportId: sport._id,
    isActive: true,
    sportHistory: [
      {
        sportId: sport._id,
        effectiveFrom: new Date("2026-01-01"),
        effectiveTo: null,
      },
    ],
  });

  console.log(`✓ Test athlete created: "${testPlayer.fullName}" (ID: ${testPlayer._id.toString()})`);

  const createdRemarkIds: Types.ObjectId[] = [];

  try {
    // 3. Test Identity Resolution via Authenticated User ID
    console.log("\n--- Testing Identity Resolution & Safe Profile ---");
    const resolved = await PlayerPortalService.resolvePlayerForUser(testUser._id.toString());
    assert.equal(resolved._id.toString(), testPlayer._id.toString());
    assert.equal(resolved.fullName, testPlayer.fullName);
    console.log("✓ Identity correctly resolved from authenticated User ID without client overrides");

    const safeProfile = await PlayerPortalService.getPlayerProfile(testUser._id.toString());
    assert.equal(safeProfile.fullName, testPlayer.fullName);
    assert.equal(safeProfile.email, testUser.email);
    assert.equal(safeProfile.sportName, sport.name);
    const safeProfileRecord = safeProfile as unknown as Record<string, unknown>;
    assert.equal(safeProfileRecord.passwordHash, undefined);
    assert.equal(safeProfileRecord.activationCode, undefined);
    console.log("✓ Safe profile returns athlete attributes and excludes all security credentials");

    // 4. Test Player Dashboard Overview
    console.log("\n--- Testing Player Dashboard Overview ---");
    const dashboard = await PlayerPortalService.getPlayerDashboard(testUser._id.toString());
    assert.ok(dashboard.profile);
    assert.ok(dashboard.attendance);
    assert.ok(dashboard.matches);
    assert.ok(dashboard.readiness);
    assert.equal(Array.isArray(dashboard.recentRemarks), true);
    console.log(`✓ Dashboard metrics retrieved: Attendance = ${dashboard.attendance.attendancePercentage}, Matches = ${dashboard.matches.finalizedMatchesPlayed}, Readiness = ${dashboard.readiness.status}`);

    // 5. Test Coach Remarks Lifecycle & Security Controls
    console.log("\n--- Testing Coach Remarks Lifecycle & Isolation ---");
    const newRemark = await RemarkService.create({
      playerId: testPlayer._id.toString(),
      content: "Excellent tactical discipline during practice transitions.",
    });
    createdRemarkIds.push(newRemark._id as Types.ObjectId);
    assert.ok(newRemark._id);
    console.log(`✓ Coach remark created: "${newRemark.content}"`);

    // Verify Player views remark
    const playerRemarksBefore = await PlayerPortalService.getPlayerRemarks(testUser._id.toString());
    const foundInPlayerRemarks = playerRemarksBefore.find((r) => r.id === newRemark._id.toString());
    assert.ok(foundInPlayerRemarks);
    assert.equal(foundInPlayerRemarks.content, "Excellent tactical discipline during practice transitions.");
    console.log("✓ Player successfully views newly created coach remark");

    // Cross-player manipulation attempt: Try updating with mismatched playerId
    const dummyOtherPlayerId = new Types.ObjectId().toString();
    const maliciousUpdate = await RemarkService.update(
      newRemark._id.toString(),
      dummyOtherPlayerId,
      { content: "Hacked remark content" }
    );
    assert.equal(maliciousUpdate, null, "Remark update must reject mismatched player ID");
    console.log("✓ Cross-player remark modification attempt correctly rejected");

    // Legitimate update
    const validUpdate = await RemarkService.update(
      newRemark._id.toString(),
      testPlayer._id.toString(),
      { content: "Updated tactical pointers: focus on early release." }
    );
    assert.ok(validUpdate);
    assert.equal(validUpdate.content, "Updated tactical pointers: focus on early release.");
    console.log("✓ Coach remark updated successfully");

    // Verify player sees updated remark
    const playerRemarksAfter = await PlayerPortalService.getPlayerRemarks(testUser._id.toString());
    const updatedInPlayerRemarks = playerRemarksAfter.find((r) => r.id === newRemark._id.toString());
    assert.ok(updatedInPlayerRemarks);
    assert.equal(updatedInPlayerRemarks.content, "Updated tactical pointers: focus on early release.");
    console.log("✓ Player sees updated remark content");

    // Legitimate deletion
    const deleted = await RemarkService.delete(newRemark._id.toString(), testPlayer._id.toString());
    assert.equal(deleted, true);
    console.log("✓ Coach remark deleted successfully");

    // Verify remark is gone from player view
    const playerRemarksDeleted = await PlayerPortalService.getPlayerRemarks(testUser._id.toString());
    assert.equal(
      playerRemarksDeleted.some((r) => r.id === newRemark._id.toString()),
      false
    );
    console.log("✓ Deleted remark is immediately absent from player feedback");

    // 6. Test Archived Athlete Isolation
    console.log("\n--- Testing Archived Athlete Security ---");
    testPlayer.isActive = false;
    await testPlayer.save();

    let archivedRejected = false;
    try {
      await PlayerPortalService.resolvePlayerForUser(testUser._id.toString());
    } catch (err: unknown) {
      archivedRejected = true;
      assert.match(err instanceof Error ? err.message : String(err), /archived/i);
    }
    assert.equal(archivedRejected, true, "Archived player must be denied portal access");
    console.log("✓ Archived athlete profile correctly denied portal access");

    console.log("\n=======================================================");
    console.log("All Phase 9 Live MongoDB Atlas Integration Tests Passed!");
    console.log("=======================================================\n");
  } finally {
    // Cleanup test records
    await CoachRemarkModel.deleteMany({ _id: { $in: createdRemarkIds } });
    await PlayerModel.findByIdAndDelete(testPlayer._id);
    await UserModel.findByIdAndDelete(testUser._id);
    console.log("✓ Cleaned up test athlete, user, and remarks");
  }
}

runPlayerRemarksLiveDbTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Live test execution error:", err);
    process.exit(1);
  });
