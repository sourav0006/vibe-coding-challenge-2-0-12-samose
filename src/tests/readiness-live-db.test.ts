import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Types } from "mongoose";
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
import { ReadinessService } from "../lib/services/readiness.service";
import { MatchService } from "../lib/services/match.service";

async function runLiveDbIntegrationTests() {
  console.log("\n=======================================================");
  console.log("One Academy: Phase 8 Live MongoDB Atlas Integration Tests");
  console.log("=======================================================\n");

  await connectToDatabase();
  console.log("✓ Connected to MongoDB Atlas successfully");

  // 1. Fetch active sport
  const sport = await SportModel.findOne({ isActive: true }).exec();
  assert.ok(sport, "At least one active sport must exist in MongoDB Atlas");
  console.log(`✓ Active sport retrieved: "${sport.name}" (${sport._id.toString()})`);

  // 2. Setup 3 active test players + 1 archived test player
  const ts = Date.now();
  const testUsers = await Promise.all([
    UserModel.create({ email: `ready_user1_${ts}@test.com`, passwordHash: "dummy", role: "player", isActive: true }),
    UserModel.create({ email: `ready_user2_${ts}@test.com`, passwordHash: "dummy", role: "player", isActive: true }),
    UserModel.create({ email: `ready_user3_${ts}@test.com`, passwordHash: "dummy", role: "player", isActive: true }),
    UserModel.create({ email: `ready_user4_${ts}@test.com`, passwordHash: "dummy", role: "player", isActive: false }),
  ]);

  const p1 = await PlayerModel.create({
    userId: testUsers[0]._id,
    fullName: `Ready Athlete One ${ts}`,
    age: 18,
    sportId: sport._id,
    isActive: true,
    sportHistory: [{ sportId: sport._id, effectiveFrom: new Date("2026-01-01"), effectiveTo: null }],
  });

  const p2 = await PlayerModel.create({
    userId: testUsers[1]._id,
    fullName: `NotReady Attendance Low ${ts}`,
    age: 19,
    sportId: sport._id,
    isActive: true,
    sportHistory: [{ sportId: sport._id, effectiveFrom: new Date("2026-01-01"), effectiveTo: null }],
  });

  const p3 = await PlayerModel.create({
    userId: testUsers[2]._id,
    fullName: `NotReady Match Low ${ts}`,
    age: 20,
    sportId: sport._id,
    isActive: true,
    sportHistory: [{ sportId: sport._id, effectiveFrom: new Date("2026-01-01"), effectiveTo: null }],
  });

  const p4 = await PlayerModel.create({
    userId: testUsers[3]._id,
    fullName: `Archived Player ${ts}`,
    age: 22,
    sportId: sport._id,
    isActive: false, // Archived
    sportHistory: [{ sportId: sport._id, effectiveFrom: new Date("2026-01-01"), effectiveTo: null }],
  });

  console.log(`✓ Test players created: P1 (target Ready), P2 (target NotReady-Att), P3 (target NotReady-Match), P4 (Archived)`);

  const createdSessionIds: Types.ObjectId[] = [];
  const createdMatchIds: Types.ObjectId[] = [];

  try {
    // 3. Create 5 closed practice sessions
    // P1: Present in 4 of 5 = 80.0% (>= 75%)
    // P2: Present in 3 of 5 = 60.0% (< 75%)
    // P3: Present in 5 of 5 = 100.0% (>= 75%)
    console.log("\n--- Setting up Practice Sessions & Attendance ---");
    for (let i = 1; i <= 5; i++) {
      const session = await PracticeSessionModel.create({
        sportId: sport._id,
        sessionDate: new Date(`2026-09-0${i}`),
        status: "closed",
        closedAt: new Date(),
      });
      createdSessionIds.push(session._id);

      // P1: present in sessions 1, 2, 3, 4; absent in session 5 (4/5 = 80%)
      await AttendanceModel.create({
        sessionId: session._id,
        playerId: p1._id,
        status: i <= 4 ? "present" : "absent",
      });

      // P2: present in sessions 1, 2, 3; absent in 4, 5 (3/5 = 60%)
      await AttendanceModel.create({
        sessionId: session._id,
        playerId: p2._id,
        status: i <= 3 ? "present" : "absent",
      });

      // P3: present in all 5 (5/5 = 100%)
      await AttendanceModel.create({
        sessionId: session._id,
        playerId: p3._id,
        status: "present",
      });
    }
    console.log(`✓ 5 closed practice sessions created with verified attendance rates: P1=80.0%, P2=60.0%, P3=100.0%`);

    // 4. Create Finalized Matches
    // Match 1: P1, P2, P3 participated (finalized)
    // Match 2: P1, P2 participated (finalized)
    // Result:
    // P1 has 2 finalized matches
    // P2 has 2 finalized matches
    // P3 has 1 finalized match
    console.log("\n--- Setting up Finalized Matches & Scores ---");
    const match1 = await MatchModel.create({
      sportId: sport._id,
      matchDate: new Date("2026-10-10"),
      opponentName: `Opponent A ${ts}`,
      status: "finalized",
      finalizedAt: new Date(),
    });
    createdMatchIds.push(match1._id);

    const match2 = await MatchModel.create({
      sportId: sport._id,
      matchDate: new Date("2026-10-20"),
      opponentName: `Opponent B ${ts}`,
      status: "finalized",
      finalizedAt: new Date(),
    });
    createdMatchIds.push(match2._id);

    // Draft match (should NOT count towards readiness!)
    const draftMatch = await MatchModel.create({
      sportId: sport._id,
      matchDate: new Date("2026-10-30"),
      opponentName: `Opponent Draft ${ts}`,
      status: "draft",
    });
    createdMatchIds.push(draftMatch._id);

    // Record participants
    await MatchParticipantModel.create([
      { matchId: match1._id, playerId: p1._id, score: 8.5 },
      { matchId: match1._id, playerId: p2._id, score: 7.0 },
      { matchId: match1._id, playerId: p3._id, score: 9.0 },
      { matchId: match2._id, playerId: p1._id, score: 9.0 },
      { matchId: match2._id, playerId: p2._id, score: 6.5 },
      // P3 is in draftMatch — must NOT count towards finalized matches!
      { matchId: draftMatch._id, playerId: p3._id, score: 8.0 },
    ]);
    console.log(`✓ Matches created: Match 1 & 2 finalized, Match 3 draft. Participation recorded.`);

    // 5. Test Individual Player Readiness Evaluations
    console.log("\n--- Testing Authoritative Readiness Evaluations ---");

    const r1 = await ReadinessService.getPlayerReadiness(p1._id.toString());
    assert.ok(r1, "P1 readiness must not be null");
    assert.equal(r1.readinessStatus, "ready", "P1 has 80% attendance and 2 matches -> READY");
    assert.equal(r1.isReady, true);
    assert.equal(r1.attendanceCriterionMet, true);
    assert.equal(r1.matchCriterionMet, true);
    assert.equal(r1.finalizedMatchesPlayed, 2);
    console.log(`✓ P1 evaluated: status = "ready" (Attendance: ${r1.attendancePercentage}, Matches: ${r1.finalizedMatchesPlayed})`);

    const r2 = await ReadinessService.getPlayerReadiness(p2._id.toString());
    assert.ok(r2, "P2 readiness must not be null");
    assert.equal(r2.readinessStatus, "not_ready", "P2 has 60% attendance -> NOT READY");
    assert.equal(r2.isReady, false);
    assert.equal(r2.attendanceCriterionMet, false);
    assert.equal(r2.matchCriterionMet, true);
    console.log(`✓ P2 evaluated: status = "not_ready" (Attendance 60.0% < 75.0% threshold)`);

    const r3 = await ReadinessService.getPlayerReadiness(p3._id.toString());
    assert.ok(r3, "P3 readiness must not be null");
    assert.equal(r3.readinessStatus, "not_ready", "P3 has only 1 finalized match -> NOT READY");
    assert.equal(r3.isReady, false);
    assert.equal(r3.attendanceCriterionMet, true);
    assert.equal(r3.matchCriterionMet, false, "Draft match does not count towards finalized matches");
    assert.equal(r3.finalizedMatchesPlayed, 1);
    console.log(`✓ P3 evaluated: status = "not_ready" (Matches 1 < 2 threshold, draft match excluded)`);

    // 6. Test Coach Readiness List & Filtering
    console.log("\n--- Testing Coach Readiness List & Filter Invariants ---");
    const coachListAll = await ReadinessService.getCoachReadinessList({ page: 1, limit: 100 });
    const p1InCoachList = coachListAll.players.find((p) => p.playerId === p1._id.toString());
    const p2InCoachList = coachListAll.players.find((p) => p.playerId === p2._id.toString());
    const p4InCoachList = coachListAll.players.find((p) => p.playerId === p4._id.toString());

    assert.ok(p1InCoachList, "Active P1 must be in Coach readiness list");
    assert.ok(p2InCoachList, "Active P2 must be in Coach readiness list");
    assert.equal(p4InCoachList, undefined, "Archived player P4 must be excluded from Coach readiness list");
    console.log(`✓ Coach list includes active players and strictly excludes archived players`);

    // Filter by status: ready
    const coachListReady = await ReadinessService.getCoachReadinessList({ status: "ready" });
    const p1InReadyList = coachListReady.players.find((p) => p.playerId === p1._id.toString());
    const p2InReadyList = coachListReady.players.find((p) => p.playerId === p2._id.toString());
    assert.ok(p1InReadyList, "Ready P1 must be in ready-filtered list");
    assert.equal(p2InReadyList, undefined, "NotReady P2 must NOT be in ready-filtered list");
    console.log(`✓ Status filter "ready" correctly isolates qualified players`);

    // 7. Test Scout Discovery & Strict Readiness Security
    console.log("\n--- Testing Scout Discovery Portal & Security Guarantees ---");
    const scoutDiscovery = await ReadinessService.getScoutReadyPlayers({ page: 1, limit: 50 });
    const p1InScout = scoutDiscovery.players.find((p) => p.id === p1._id.toString());
    const p2InScout = scoutDiscovery.players.find((p) => p.id === p2._id.toString());
    const p3InScout = scoutDiscovery.players.find((p) => p.id === p3._id.toString());
    const p4InScout = scoutDiscovery.players.find((p) => p.id === p4._id.toString());

    assert.ok(p1InScout, "Ready player P1 MUST be returned to Scout");
    assert.equal(p2InScout, undefined, "NotReady player P2 MUST NEVER be returned to Scout");
    assert.equal(p3InScout, undefined, "NotReady player P3 MUST NEVER be returned to Scout");
    assert.equal(p4InScout, undefined, "Archived player P4 MUST NEVER be returned to Scout");
    console.log(`✓ Scout discovery strictly returns ONLY Ready players. Non-ready and archived players are invisible.`);

    // 8. Test Direct Profile Access & 404 Invariant
    console.log("\n--- Testing Direct Profile Access (404 for Non-Ready) ---");
    // P1 is Ready: profile must be returned
    const p1Profile = await ReadinessService.getScoutPlayerProfile(p1._id.toString());
    assert.ok(p1Profile, "Scout profile must be accessible for Ready player P1");
    assert.equal(p1Profile.player.fullName, p1.fullName);
    assert.equal(p1Profile.matches.totalFinalizedMatches, 2);
    // Verify Coach Remarks are completely absent from profile object
    assert.equal((p1Profile as unknown as Record<string, unknown>).remarks, undefined);
    assert.equal((p1Profile as unknown as Record<string, unknown>).coachRemarks, undefined);
    console.log(`✓ Ready player P1 profile accessible with accurate metrics and NO Coach Remarks`);

    // P2 is Not Ready: profile must return null (404)
    const p2Profile = await ReadinessService.getScoutPlayerProfile(p2._id.toString());
    assert.equal(p2Profile, null, "Direct profile request for NotReady player P2 MUST return null (404)");
    console.log(`✓ NotReady player P2 direct profile correctly returns null (404)`);

    // P3 is Not Ready: profile must return null (404)
    const p3Profile = await ReadinessService.getScoutPlayerProfile(p3._id.toString());
    assert.equal(p3Profile, null, "Direct profile request for NotReady player P3 MUST return null (404)");
    console.log(`✓ NotReady player P3 direct profile correctly returns null (404)`);

    // P4 is Archived: profile must return null (404)
    const p4Profile = await ReadinessService.getScoutPlayerProfile(p4._id.toString());
    assert.equal(p4Profile, null, "Direct profile request for archived player P4 MUST return null (404)");
    console.log(`✓ Archived player P4 direct profile correctly returns null (404)`);

    // 9. Test Dynamic Calculation Invalidation
    console.log("\n--- Testing Dynamic Calculation (Match Finalization) ---");
    // Finalize the draft match where P3 participated
    await MatchService.finalizeMatch(draftMatch._id.toString());
    console.log(`✓ Finalized the draft match`);

    // Re-check P3 readiness: now has 5/5 attendance (100%) and 2 finalized matches -> MUST BE READY!
    const r3Updated = await ReadinessService.getPlayerReadiness(p3._id.toString());
    assert.ok(r3Updated);
    assert.equal(r3Updated.readinessStatus, "ready", "P3 must now be READY after match finalization");
    assert.equal(r3Updated.finalizedMatchesPlayed, 2);

    // Scout can now access P3 profile!
    const p3ProfileUpdated = await ReadinessService.getScoutPlayerProfile(p3._id.toString());
    assert.ok(p3ProfileUpdated, "P3 profile must now be accessible to Scout without manual flags");
    console.log(`✓ P3 automatically transitioned to READY upon match finalization without manual triggers`);

    console.log("\n=======================================================");
    console.log("ALL LIVE MONGODB ATLAS PHASE 8 TESTS PASSED (100%)");
    console.log("=======================================================\n");
  } finally {
    // Cleanup temporary test records
    console.log("Cleaning up live database test artifacts...");
    for (const matchId of createdMatchIds) {
      await MatchParticipantModel.deleteMany({ matchId });
      await MatchModel.findByIdAndDelete(matchId);
    }
    for (const sessionId of createdSessionIds) {
      await AttendanceModel.deleteMany({ sessionId });
      await PracticeSessionModel.findByIdAndDelete(sessionId);
    }
    await PlayerModel.deleteMany({ _id: { $in: [p1._id, p2._id, p3._id, p4._id] } });
    await UserModel.deleteMany({ _id: { $in: testUsers.map((u) => u._id) } });
    console.log("✓ Cleanup completed successfully");
  }
}

runLiveDbIntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Live integration tests failed:", err);
    process.exit(1);
  });
