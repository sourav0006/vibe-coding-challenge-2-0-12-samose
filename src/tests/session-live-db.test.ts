import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "../lib/db";
import {
  SportModel,
  PlayerModel,
  PracticeSessionModel,
  AttendanceModel,
} from "../models";
import { SessionService } from "../lib/services/session.service";
import { AttendanceService } from "../lib/services/attendance.service";

async function runLiveDbIntegrationTests() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 6 Live MongoDB Atlas Integration Tests");
  console.log("=======================================================\n");

  await connectToDatabase();
  console.log("✓ Connected to MongoDB Atlas successfully");

  // 1. Verify Active Sport exists
  const sport = await SportModel.findOne({ isActive: true }).exec();
  assert.ok(sport, "At least one active sport must exist in MongoDB Atlas");
  console.log(`✓ Using active sport: "${sport.name}" (${sport._id.toString()})`);

  // 2. Fetch or create a test player for this sport
  let testPlayer = await PlayerModel.findOne({ sportId: sport._id, isActive: true }).exec();
  let createdTestPlayer = false;
  let testUser = null;

  if (!testPlayer) {
    const { UserModel } = await import("../models/user.model");
    testUser = new UserModel({
      email: `testplayer_${Date.now()}@example.com`,
      passwordHash: "dummyhash",
      role: "player",
      isActive: true,
    });
    await testUser.save();

    testPlayer = new PlayerModel({
      userId: testUser._id,
      fullName: "Live Test Player",
      age: 20,
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
    await testPlayer.save();
    createdTestPlayer = true;
    console.log(`✓ Created temporary test player: "${testPlayer.fullName}" (${testPlayer._id.toString()})`);
  } else {
    console.log(`✓ Using existing player: "${testPlayer.fullName}" (${testPlayer._id.toString()})`);
  }

  // Test date for this live integration test
  const testDate = "2026-11-25";
  const { startOfDay, endOfDay } = SessionService.normalizeSessionDate(testDate);

  // Clean up any lingering prior test session on this date
  const prior = await PracticeSessionModel.findOne({
    sportId: sport._id,
    sessionDate: { $gte: startOfDay, $lte: endOfDay },
  }).exec();
  if (prior) {
    await AttendanceModel.deleteMany({ sessionId: prior._id }).exec();
    await PracticeSessionModel.findByIdAndDelete(prior._id).exec();
  }

  // 3. Test Session Creation
  console.log("\n--- Testing Session Creation ---");
  const session = await SessionService.create({
    sportId: sport._id.toString(),
    sessionDate: new Date(testDate),
  });
  assert.equal(session.status, "open");
  assert.equal(session.sportId.toString(), sport._id.toString());
  console.log(`✓ Practice session created successfully with ID: ${session._id.toString()}`);

  // 4. Test Duplicate Prevention
  console.log("\n--- Testing Duplicate Prevention ---");
  let duplicateError = false;
  try {
    await SessionService.create({
      sportId: sport._id.toString(),
      sessionDate: new Date(testDate),
    });
  } catch (err) {
    duplicateError = true;
    assert.match((err as Error).message, /Conflict: A practice session already exists/);
  }
  assert.equal(duplicateError, true, "Duplicate session on same date should be rejected");
  console.log("✓ Duplicate session on same sport and calendar date was successfully rejected");

  // 5. Test Applicable Players Retrieval
  console.log("\n--- Testing Applicable Players Retrieval ---");
  const eligiblePlayers = await AttendanceService.getEligiblePlayersForSession(session);
  console.log(`✓ Retrieved ${eligiblePlayers.length} eligible player(s) for the practice session`);

  // 6. Test Premature Closure Rejection (if eligible players exist)
  if (eligiblePlayers.length > 0) {
    console.log("\n--- Testing Premature Closure Prevention ---");
    let prematureCloseError = false;
    try {
      await SessionService.closeSession(session._id.toString());
    } catch (err) {
      prematureCloseError = true;
      assert.match((err as Error).message, /Cannot close session: .* unmarked/);
    }
    assert.equal(prematureCloseError, true, "Session cannot close with unmarked players");
    console.log("✓ Premature session closure was successfully blocked by backend validation");

    // 7. Test Attendance Marking
    console.log("\n--- Testing Attendance Marking ---");
    const testPlayer = eligiblePlayers[0];
    const markRes = await AttendanceService.markAttendance({
      sessionId: session._id.toString(),
      playerId: testPlayer._id.toString(),
      status: "present",
    });
    assert.equal(markRes.status, "present");
    console.log(`✓ Marked player "${testPlayer.fullName}" as PRESENT`);

    // Update to ABSENT while open
    const updateRes = await AttendanceService.markAttendance({
      sessionId: session._id.toString(),
      playerId: testPlayer._id.toString(),
      status: "absent",
    });
    assert.equal(updateRes.status, "absent");
    console.log(`✓ Updated player "${testPlayer.fullName}" attendance to ABSENT while session is open`);

    // Verify Attendance Sheet
    const sheet = await SessionService.getAttendanceSheet(session._id.toString());
    assert.ok(sheet);
    assert.equal(sheet.stats.absentCount, 1);
    console.log(`✓ Verified attendance sheet: ${sheet.stats.markedCount}/${sheet.stats.applicableCount} marked`);

    // Mark all remaining players to allow closure
    if (eligiblePlayers.length > 1) {
      const remainingMarks = eligiblePlayers.slice(1).map((p) => ({
        playerId: p._id.toString(),
        status: "present" as const,
      }));
      await AttendanceService.recordSessionAttendance(session._id.toString(), remainingMarks);
      console.log(`✓ Marked all remaining ${remainingMarks.length} player(s)`);
    }

    // 8. Test Session Closure
    console.log("\n--- Testing Session Closure & Finalization ---");
    const closedSession = await SessionService.closeSession(session._id.toString());
    assert.ok(closedSession);
    assert.equal(closedSession.status, "closed");
    assert.ok(closedSession.closedAt);
    console.log(`✓ Practice session closed and finalized at: ${closedSession.closedAt?.toISOString()}`);

    // 9. Test Immutability of Closed Session
    console.log("\n--- Testing Closed Session Immutability ---");
    let editClosedError = false;
    try {
      await AttendanceService.markAttendance({
        sessionId: session._id.toString(),
        playerId: testPlayer._id.toString(),
        status: "present",
      });
    } catch (err) {
      editClosedError = true;
      assert.match((err as Error).message, /Cannot record or modify attendance for a closed session/);
    }
    assert.equal(editClosedError, true, "Modifying attendance on a closed session must be rejected");
    console.log("✓ Backend strictly rejected attendance write on closed session");

    // 10. Test Individual Player Attendance Calculation Engine
    console.log("\n--- Testing Player Attendance Calculation Engine ---");
    const playerStats = await AttendanceService.getPlayerAttendanceStats(testPlayer._id.toString());
    assert.ok(playerStats);
    assert.ok(playerStats.totalSessions >= 1);
    assert.ok(playerStats.attendancePercentage !== "N/A");
    console.log(
      `✓ Player "${playerStats.player.fullName}" attendance stats: ` +
        `${playerStats.presentCount}/${playerStats.totalSessions} present ` +
        `(${playerStats.attendancePercentage})`
    );
  }

  // Cleanup test session & attendance
  await AttendanceModel.deleteMany({ sessionId: session._id }).exec();
  await PracticeSessionModel.findByIdAndDelete(session._id).exec();
  if (createdTestPlayer && testPlayer) {
    const { UserModel } = await import("../models/user.model");
    await PlayerModel.findByIdAndDelete(testPlayer._id).exec();
    if (testUser) {
      await UserModel.findByIdAndDelete(testUser._id).exec();
    }
  }
  console.log("\n✓ Cleaned up test session, attendance, and temporary test player from MongoDB Atlas");

  console.log("\n=======================================================");
  console.log("Live MongoDB Atlas Integration Tests Completed Successfully!");
  console.log("=======================================================\n");

  process.exit(0);
}

runLiveDbIntegrationTests().catch((err) => {
  console.error("Live DB Test Failed:", err);
  process.exit(1);
});
