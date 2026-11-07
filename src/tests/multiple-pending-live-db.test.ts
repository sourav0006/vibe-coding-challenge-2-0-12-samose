import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import assert from "node:assert/strict";
import { connectToDatabase } from "../lib/db";
import { UserModel, PlayerModel, ScoutModel, SportModel, ActivationCodeModel } from "../models";
import { PlayerService, ScoutService, AuthService } from "../lib/services";

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

async function runLiveDbVerification() {
  console.log("\n========================================================");
  console.log("One Academy: Multiple Pending Accounts Live Atlas DB Verification");
  console.log("========================================================\n");

  await connectToDatabase();

  const timestamp = Date.now();
  const createdUserIds: string[] = [];
  const createdPlayerIds: string[] = [];
  const createdScoutIds: string[] = [];

  // Ensure an active sport exists
  let activeSport = await SportModel.findOne({ isActive: true }).exec();
  if (!activeSport) {
    activeSport = await SportModel.create({
      name: `Test Multi Sport ${timestamp}`,
      isActive: true,
      description: "Test sport for multiple pending verification",
    });
  }

  const playerCreations: Array<{
    name: string;
    email: string;
    code: string;
    userId: string;
    playerId: string;
  }> = [];

  const scoutCreations: Array<{
    name: string;
    email: string;
    code: string;
    userId: string;
    scoutId: string;
  }> = [];

  try {
    // 1. Create 5 pending players sequentially
    await test("Live DB: Create 5 independent pending Player accounts", async () => {
      for (let i = 1; i <= 5; i++) {
        const email = `live_pending_player_${timestamp}_${i}@test.com`;
        const fullName = `Live Pending Player ${i}`;
        const result = await PlayerService.createPlayerWithAccount({
          fullName,
          email,
          age: 15 + i,
          sportId: activeSport._id.toString(),
        });

        createdUserIds.push(result.userId);
        createdPlayerIds.push(result.player._id.toString());
        playerCreations.push({
          name: fullName,
          email,
          code: result.activationCode,
          userId: result.userId,
          playerId: result.player._id.toString(),
        });

        // Verify User is inactive
        const userDoc = await UserModel.findById(result.userId).exec();
        assert.equal(userDoc?.isActive, false, `User ${email} must be inactive`);

        // Verify Player profile is active
        const playerDoc = await PlayerModel.findById(result.player._id).exec();
        assert.equal(playerDoc?.isActive, true, `Player ${fullName} must be active profile`);
      }

      assert.equal(playerCreations.length, 5);
    });

    // 2. Create 5 pending scouts sequentially
    await test("Live DB: Create 5 independent pending Scout accounts", async () => {
      for (let i = 1; i <= 5; i++) {
        const email = `live_pending_scout_${timestamp}_${i}@test.com`;
        const fullName = `Live Pending Scout ${i}`;
        const result = await ScoutService.createScoutWithAccount({
          fullName,
          email,
        });

        createdUserIds.push(result.userId);
        createdScoutIds.push(result.scout._id.toString());
        scoutCreations.push({
          name: fullName,
          email,
          code: result.activationCode,
          userId: result.userId,
          scoutId: result.scout._id.toString(),
        });

        const userDoc = await UserModel.findById(result.userId).exec();
        assert.equal(userDoc?.isActive, false, `Scout user ${email} must be inactive`);

        const scoutDoc = await ScoutModel.findById(result.scout._id).exec();
        assert.equal(scoutDoc?.isActive, true, `Scout ${fullName} must be active profile`);
      }

      assert.equal(scoutCreations.length, 5);
    });

    // 3. Verify pagination and status filtering
    await test("Live DB: findPlayersPaginated and findScoutsPaginated show pending accounts", async () => {
      const playersRes = await PlayerService.findPlayersPaginated({
        status: "pending",
        limit: 50,
      });
      const foundCreatedPlayers = playersRes.players.filter((p) =>
        playerCreations.some((cp) => cp.playerId === p.id)
      );
      assert.equal(foundCreatedPlayers.length, 5, "All 5 created players must appear as pending");

      const scoutsRes = await ScoutService.findScoutsPaginated({
        status: "pending",
        limit: 50,
      });
      const foundCreatedScouts = scoutsRes.scouts.filter((s) =>
        scoutCreations.some((cs) => cs.scoutId === s.id)
      );
      assert.equal(foundCreatedScouts.length, 5, "All 5 created scouts must appear as pending");
    });

    // 4. Duplicate email rejection
    await test("Live DB: Duplicate email is rejected with 409 Conflict", async () => {
      await assert.rejects(
        async () => {
          await PlayerService.createPlayerWithAccount({
            fullName: "Duplicate Live Player",
            email: playerCreations[0].email,
            age: 18,
            sportId: activeSport._id.toString(),
          });
        },
        (err: Error) => {
          assert.match(err.message, /Conflict: An account with email.*already exists/);
          return true;
        }
      );
    });

    // 5. Arbitrary activation of one player and one scout
    await test("Live DB: Activate Player 3 and Scout 2 without affecting others", async () => {
      const targetPlayer = playerCreations[2]; // Player 3
      const targetScout = scoutCreations[1]; // Scout 2

      // Activate Player 3
      const activatedPlayerUser = await AuthService.activateAccount({
        email: targetPlayer.email,
        code: targetPlayer.code,
        password: "Player3Password123!",
      });
      assert.equal(activatedPlayerUser.email, targetPlayer.email);

      // Verify DB state
      const dbPlayerUser = await UserModel.findById(targetPlayer.userId).exec();
      assert.equal(dbPlayerUser?.isActive, true, "Player 3 user must now be active");

      // Activate Scout 2
      const activatedScoutUser = await AuthService.activateAccount({
        email: targetScout.email,
        code: targetScout.code,
        password: "Scout2Password123!",
      });
      assert.equal(activatedScoutUser.email, targetScout.email);

      const dbScoutUser = await UserModel.findById(targetScout.userId).exec();
      assert.equal(dbScoutUser?.isActive, true, "Scout 2 user must now be active");

      // Verify Player 1, 2, 4, 5 are still inactive
      for (let i = 0; i < playerCreations.length; i++) {
        if (i === 2) continue;
        const u = await UserModel.findById(playerCreations[i].userId).exec();
        assert.equal(u?.isActive, false, `Player ${i + 1} must still be inactive`);
      }

      // Verify Scout 1, 3, 4, 5 are still inactive
      for (let i = 0; i < scoutCreations.length; i++) {
        if (i === 1) continue;
        const u = await UserModel.findById(scoutCreations[i].userId).exec();
        assert.equal(u?.isActive, false, `Scout ${i + 1} must still be inactive`);
      }
    });

    // 6. Activating with an already used code fails
    await test("Live DB: Re-activating with used code fails", async () => {
      const targetPlayer = playerCreations[2];
      await assert.rejects(
        async () => {
          await AuthService.activateAccount({
            email: targetPlayer.email,
            code: targetPlayer.code,
            password: "AnotherPassword123!",
          });
        },
        (err: Error) => {
          assert.match(err.message, /already active|invalid/);
          return true;
        }
      );
    });

    // 7. Activating remaining pending accounts in arbitrary order succeeds
    await test("Live DB: Activate remaining accounts (Player 5, Scout 4, Player 1)", async () => {
      // Activate Player 5
      await AuthService.activateAccount({
        email: playerCreations[4].email,
        code: playerCreations[4].code,
        password: "Player5Password123!",
      });
      const p5User = await UserModel.findById(playerCreations[4].userId).exec();
      assert.equal(p5User?.isActive, true);

      // Activate Scout 4
      await AuthService.activateAccount({
        email: scoutCreations[3].email,
        code: scoutCreations[3].code,
        password: "Scout4Password123!",
      });
      const s4User = await UserModel.findById(scoutCreations[3].userId).exec();
      assert.equal(s4User?.isActive, true);

      // Activate Player 1
      await AuthService.activateAccount({
        email: playerCreations[0].email,
        code: playerCreations[0].code,
        password: "Player1Password123!",
      });
      const p1User = await UserModel.findById(playerCreations[0].userId).exec();
      assert.equal(p1User?.isActive, true);
    });
  } finally {
    // Clean up created live DB records
    console.log("\n--- Cleaning up created live test records ---");
    if (createdPlayerIds.length > 0) {
      await PlayerModel.deleteMany({ _id: { $in: createdPlayerIds } }).exec();
    }
    if (createdScoutIds.length > 0) {
      await ScoutModel.deleteMany({ _id: { $in: createdScoutIds } }).exec();
    }
    if (createdUserIds.length > 0) {
      await ActivationCodeModel.deleteMany({ userId: { $in: createdUserIds } }).exec();
      await UserModel.deleteMany({ _id: { $in: createdUserIds } }).exec();
    }
    console.log("Cleaned up all live test records successfully.");
  }

  console.log("\n========================================================");
  console.log(`Live DB Verification Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLiveDbVerification().then(() => process.exit(0)).catch((err) => {
  console.error("Live DB verification failed:", err);
  process.exit(1);
});

