import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "../lib/db";
import {
  SportModel,
  PlayerModel,
  PracticeSessionModel,
  AttendanceModel,
  MatchModel,
  MatchParticipantModel,
  UserModel,
} from "../models";
import { MatchService } from "../lib/services/match.service";
import { SessionService } from "../lib/services/session.service";

async function runLiveDbIntegrationTests() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 7 Live MongoDB Atlas Integration Tests");
  console.log("=======================================================\n");

  await connectToDatabase();
  console.log("✓ Connected to MongoDB Atlas successfully");

  // 1. Fetch active sport
  const sport = await SportModel.findOne({ isActive: true }).exec();
  assert.ok(sport, "At least one active sport must exist in MongoDB Atlas");
  console.log(`✓ Active sport retrieved: "${sport.name}" (${sport._id.toString()})`);

  // 2. Setup 2 test players with sport history
  const testEmail1 = `live_player1_${Date.now()}@example.com`;
  const testEmail2 = `live_player2_${Date.now()}@example.com`;

  const user1 = new UserModel({
    email: testEmail1,
    passwordHash: "dummyhash",
    role: "player",
    isActive: true,
  });
  await user1.save();

  const user2 = new UserModel({
    email: testEmail2,
    passwordHash: "dummyhash",
    role: "player",
    isActive: true,
  });
  await user2.save();

  const player1 = new PlayerModel({
    userId: user1._id,
    fullName: "Live Test Player One",
    age: 19,
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
  await player1.save();

  const player2 = new PlayerModel({
    userId: user2._id,
    fullName: "Live Test Player Two",
    age: 21,
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
  await player2.save();

  console.log(`✓ Created test player 1: "${player1.fullName}" (${player1._id.toString()})`);
  console.log(`✓ Created test player 2: "${player2.fullName}" (${player2._id.toString()})`);

  let testMatchId: string | null = null;
  let testSessionId: string | null = null;

  try {
    const testDate = "2026-11-20";
    const testOpponent = `Atlas FC Test ${Date.now()}`;
    const testTitle = `Championship Game 1 ${Date.now()}`;

    // 3. Create a Match
    console.log("\n--- Testing Match Creation ---");
    const match = await MatchService.createMatch({
      title: testTitle,
      sportId: sport._id.toString(),
      matchDate: testDate,
      opponentName: testOpponent,
    });
    testMatchId = match._id.toString();
    assert.equal(match.status, "draft");
    assert.equal(match.title, testTitle);
    assert.equal(match.opponentName, testOpponent);
    console.log(`✓ Match created with Draft status (${testMatchId})`);

    // 4. Test Duplicate Prevention & Same-Day Unlimited Fixtures
    console.log("\n--- Testing Duplicate Match Prevention & Same-Day Scheduling ---");
    let duplicateRejected = false;
    try {
      await MatchService.createMatch({
        title: testTitle,
        sportId: sport._id.toString(),
        matchDate: testDate,
        opponentName: testOpponent,
      });
    } catch (err) {
      duplicateRejected = true;
      assert.equal(
        (err as Error).message,
        "Conflict: A match with this title already exists against this opponent in this sport on the selected date. Please use a different match title."
      );
      console.log(`✓ Duplicate match correctly rejected: ${(err as Error).message}`);
    }
    assert.ok(duplicateRejected, "Duplicate match must be rejected");

    // Second fixture with different title against same opponent on same date MUST succeed
    const match2 = await MatchService.createMatch({
      title: `Championship Game 2 ${Date.now()}`,
      sportId: sport._id.toString(),
      matchDate: testDate,
      opponentName: testOpponent,
    });
    assert.ok(match2._id, "Second fixture on same day with different title must succeed");
    console.log(`✓ Second match fixture on same date succeeded: ${match2.title} (${match2._id.toString()})`);
    await MatchModel.findByIdAndDelete(match2._id);

    // 5. Test Same-Day Attendance Rules
    console.log("\n--- Testing Same-Day Attendance Constraints ---");
    // Create practice session for same date
    const session = await SessionService.create({
      sportId: sport._id.toString(),
      sessionDate: testDate,
    });
    testSessionId = session._id.toString();
    console.log(`✓ Created same-day practice session (${testSessionId}) with status "${session.status}"`);

    // Mark Player 1 as Present, Player 2 as Absent
    await AttendanceModel.create({
      sessionId: session._id,
      playerId: player1._id,
      status: "present",
      markedAt: new Date(),
    });
    await AttendanceModel.create({
      sessionId: session._id,
      playerId: player2._id,
      status: "absent",
      markedAt: new Date(),
    });
    console.log(`✓ Marked Player 1 as Present, Player 2 as Absent in practice session`);

    // While session is OPEN:
    // Adding Player 1 (Present) should succeed
    console.log("\n--- Testing Participant Scoring & Bounds ---");
    const participant1 = await MatchService.addOrUpdateParticipant(
      testMatchId,
      player1._id.toString(),
      8.5
    );
    assert.equal(participant1.score, 8.5);
    console.log(`✓ Added Player 1 to match with valid score 8.5`);

    // Adding Player 2 (Absent) must be rejected
    let absentRejected = false;
    try {
      await MatchService.addOrUpdateParticipant(
        testMatchId,
        player2._id.toString(),
        7.0
      );
    } catch (err) {
      absentRejected = true;
      console.log(`✓ Absent player correctly rejected: ${(err as Error).message}`);
    }
    assert.ok(absentRejected, "Absent player must be rejected from match participation");

    // Finalizing while practice session is open must be BLOCKED
    console.log("\n--- Testing Open Practice Session Blocking Finalization ---");
    let finalizeOpenSessionBlocked = false;
    try {
      await MatchService.finalizeMatch(testMatchId);
    } catch (err) {
      finalizeOpenSessionBlocked = true;
      console.log(`✓ Finalization correctly blocked due to open same-day session: ${(err as Error).message}`);
    }
    assert.ok(finalizeOpenSessionBlocked, "Match cannot be finalized while same-day session is open");

    // Now close the practice session
    await PracticeSessionModel.findByIdAndUpdate(session._id, { $set: { status: "closed" } });
    console.log(`✓ Closed same-day practice session`);

    // Test score bounds: score > 10 rejected
    let invalidScoreRejected = false;
    try {
      await MatchService.addOrUpdateParticipant(
        testMatchId,
        player1._id.toString(),
        11.5
      );
    } catch {
      invalidScoreRejected = true;
    }
    assert.ok(invalidScoreRejected, "Score > 10 must be rejected");
    console.log(`✓ Invalid score (11.5) correctly rejected`);

    // 6. Test Match Finalization
    console.log("\n--- Testing Match Finalization & Permanent Immutability ---");
    const finalizedMatch = await MatchService.finalizeMatch(testMatchId);
    assert.ok(finalizedMatch, "Finalized match document must not be null");
    assert.equal(finalizedMatch.status, "finalized");
    assert.ok(finalizedMatch.finalizedAt, "finalizedAt must be recorded");
    console.log(`✓ Match successfully finalized at ${finalizedMatch.finalizedAt.toISOString()}`);

    // Verify immutability:
    // a. Cannot update match details
    let updateBlocked = false;
    try {
      await MatchService.updateMatch(testMatchId, { opponentName: "New Name" });
    } catch {
      updateBlocked = true;
    }
    assert.ok(updateBlocked, "Finalized match details cannot be updated");
    console.log(`✓ Updating finalized match details correctly blocked`);

    // b. Cannot add new participants
    let addBlocked = false;
    try {
      await MatchService.addOrUpdateParticipant(testMatchId, player1._id.toString(), 9.0);
    } catch {
      addBlocked = true;
    }
    assert.ok(addBlocked, "Cannot add/update participants in finalized match");
    console.log(`✓ Adding participants to finalized match correctly blocked`);

    // c. Cannot remove participants
    let removeBlocked = false;
    try {
      await MatchService.removeParticipant(testMatchId, player1._id.toString());
    } catch {
      removeBlocked = true;
    }
    assert.ok(removeBlocked, "Cannot remove participants from finalized match");
    console.log(`✓ Removing participants from finalized match correctly blocked`);

    // 7. Verify Player Match Statistics
    console.log("\n--- Testing Player Match Statistics ---");
    const p1Stats = await MatchService.getPlayerMatchStats(player1._id.toString());
    assert.ok(p1Stats);
    assert.equal(p1Stats.totalMatchesPlayed, 1);
    assert.equal(p1Stats.averageScore, 8.5);
    assert.equal(p1Stats.highestScore, 8.5);
    assert.equal(p1Stats.lowestScore, 8.5);
    assert.equal(p1Stats.matchHistory.length, 1);
    assert.equal(p1Stats.matchHistory[0].opponentName, testOpponent);
    assert.equal(p1Stats.matchHistory[0].score, 8.5);
    console.log(`✓ Player 1 stats verified: 1 match played, avg score 8.5, highest score 8.5`);

    // Verify Player 2 has 0 matches
    const p2Stats = await MatchService.getPlayerMatchStats(player2._id.toString());
    assert.ok(p2Stats);
    assert.equal(p2Stats.totalMatchesPlayed, 0);
    assert.equal(p2Stats.averageScore, null);
    console.log(`✓ Player 2 (unselected/absent) has 0 matches recorded`);

    console.log("\n=======================================================");
    console.log("ALL LIVE MONGODB ATLAS INTEGRATION TESTS PASSED (100%)");
    console.log("=======================================================\n");
  } finally {
    // Cleanup temporary test records
    console.log("Cleaning up live database test artifacts...");
    if (testMatchId) {
      await MatchParticipantModel.deleteMany({ matchId: testMatchId });
      await MatchModel.findByIdAndDelete(testMatchId);
    }
    if (testSessionId) {
      await AttendanceModel.deleteMany({ sessionId: testSessionId });
      await PracticeSessionModel.findByIdAndDelete(testSessionId);
    }
    await PlayerModel.findByIdAndDelete(player1._id);
    await PlayerModel.findByIdAndDelete(player2._id);
    await UserModel.findByIdAndDelete(user1._id);
    await UserModel.findByIdAndDelete(user2._id);
    console.log("✓ Cleanup completed successfully");
  }
}

runLiveDbIntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Live integration tests failed:", err);
    process.exit(1);
  });
