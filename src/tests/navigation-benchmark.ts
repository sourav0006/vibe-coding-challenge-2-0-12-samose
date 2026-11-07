import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "@/lib/db";
import {
  PlayerService,
  SportService,
  SessionService,
  MatchService,
  ReadinessService,
  ScoutService,
  AttendanceService,
  RemarkService,
} from "@/lib/services";
import { PlayerModel } from "@/models/player.model";
import { PracticeSessionModel } from "@/models/practice-session.model";
import { MatchModel } from "@/models/match.model";

async function benchmark() {
  await connectToDatabase();

  // Find a sample player, session, match for detail benchmarks
  const samplePlayer = await PlayerModel.findOne({ isActive: true }).lean().exec();
  const sampleSession = await PracticeSessionModel.findOne().lean().exec();
  const sampleMatch = await MatchModel.findOne().lean().exec();

  const playerId = samplePlayer?._id?.toString() || "";
  const sessionId = sampleSession?._id?.toString() || "";
  const matchId = sampleMatch?._id?.toString() || "";

  console.log("=== ONE ACADEMY NAVIGATION BENCHMARK ===");
  console.log(`Sample Player ID: ${playerId}`);
  console.log(`Sample Session ID: ${sessionId}`);
  console.log(`Sample Match ID: ${matchId}`);
  console.log("-----------------------------------------");

  const results: Record<string, { durationMs: number; redundantClientFetch: boolean }> = {};

  // Iterations for warm average
  const RUNS = 5;

  async function measure(name: string, fn: () => Promise<unknown>, redundantClientFetch: boolean) {
    // Warmup
    await fn();

    let total = 0;
    for (let i = 0; i < RUNS; i++) {
      const start = performance.now();
      await fn();
      total += performance.now() - start;
    }
    const avg = total / RUNS;
    results[name] = {
      durationMs: Math.round(avg * 100) / 100,
      redundantClientFetch,
    };
    console.log(`[${name}] Avg Server Query Time: ${results[name].durationMs} ms (Redundant Client Fetch: ${redundantClientFetch})`);
  }

  // 1. Coach Overview -> Players
  await measure(
    "Coach Overview -> Players",
    async () => {
      await Promise.all([
        PlayerService.findPlayersPaginated({ page: 1, limit: 10 }),
        SportService.findAllActive(),
      ]);
    },
    false // Now guarded with isInitialMount
  );

  // 2. Players -> Player Profile
  await measure(
    "Players -> Player Profile",
    async () => {
      if (!playerId) return;
      await Promise.all([
        PlayerService.getPlayerDetails(playerId),
        SportService.findAllSimple(),
        AttendanceService.getPlayerAttendanceStats(playerId),
        MatchService.getPlayerMatchStats(playerId),
        ReadinessService.getPlayerReadiness(playerId),
        RemarkService.findByPlayer(playerId),
      ]);
    },
    false
  );

  // 3. Coach Overview -> Sessions
  await measure(
    "Coach Overview -> Sessions",
    async () => {
      await Promise.all([
        SessionService.findSessionsPaginated({ page: 1, limit: 10 }),
        SportService.findAllActive(),
      ]);
    },
    false
  );

  // 4. Sessions -> Session Details
  await measure(
    "Sessions -> Session Details",
    async () => {
      if (!sessionId) return;
      await SessionService.getAttendanceSheet(sessionId);
    },
    false
  );

  // 5. Coach Overview -> Matches
  await measure(
    "Coach Overview -> Matches",
    async () => {
      await Promise.all([
        MatchService.findMatchesPaginated({ page: 1, limit: 10 }),
        SportService.findAllActive(),
      ]);
    },
    false
  );

  // 6. Matches -> Match Details
  await measure(
    "Matches -> Match Details",
    async () => {
      if (!matchId) return;
      await MatchService.getMatchDetails(matchId);
    },
    false
  );

  // 7. Coach Overview -> Readiness
  await measure(
    "Coach Overview -> Readiness",
    async () => {
      await Promise.all([
        ReadinessService.getCoachReadinessList({ limit: 100 }),
        ReadinessService.getCoachReadinessStats(),
        SportService.findAllActive(),
      ]);
    },
    false // Now guarded with isInitialMount
  );

  // 8. Coach -> Scout Management
  await measure(
    "Coach -> Scout Management",
    async () => {
      await ScoutService.findScoutsPaginated({ page: 1, limit: 10 });
    },
    false
  );

  console.log("-----------------------------------------");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

benchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
