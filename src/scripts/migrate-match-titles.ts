import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "../lib/db";
import { MatchModel, MatchParticipantModel } from "../models";

export interface MigrationVerificationReport {
  totalMatches: number;
  updatedMatches: number;
  totalParticipants: number;
  invalidTitleCount: number;
  invalidNormalizedTitleCount: number;
  invalidNormalizedOpponentCount: number;
  droppedObsoleteIndexes: string[];
  activeIndexes: Array<{ name: string; key: Record<string, unknown>; unique?: boolean }>;
  compoundUniqueIndexFound: boolean;
  obsoleteIndexPresent: boolean;
}

/**
 * Migration Script: Migrate Historical Matches to Include Title and Normalized Fields
 *
 * Idempotently updates historical Match records:
 * 1. Preserves all existing match data and score sheets.
 * 2. Assigns distinct, unique legacy titles for fixtures sharing (sport, date, opponent).
 * 3. Populates `normalizedTitle` and `normalizedOpponent` in lowercase.
 * 4. Drops any obsolete index based solely on (sport, date, opponent).
 * 5. Builds and syncs compound unique index { sportId: 1, matchDate: 1, normalizedOpponent: 1, normalizedTitle: 1 }.
 * 6. Validates data integrity across all historical matches and participants.
 */
export async function migrateMatchTitles(): Promise<MigrationVerificationReport> {
  console.log("\n=======================================================");
  console.log("One Academy: Migrating Match Titles & Compound Indexes");
  console.log("=======================================================\n");

  await connectToDatabase();
  console.log("✓ Connected to MongoDB Atlas successfully.");

  // 1. Initial participant count check
  const initialParticipantCount = await MatchParticipantModel.countDocuments().exec();
  console.log(`✓ Verified ${initialParticipantCount} existing participant records prior to migration.`);

  // 2. Fetch all matches
  const allMatches = await MatchModel.find().sort({ matchDate: 1, createdAt: 1 }).exec();
  console.log(`Found ${allMatches.length} total match fixture records.`);

  let updatedMatches = 0;

  // Track titles used per group: key = `${sportId}_${dateKey}_${opponentKey}` -> Set of normalizedTitles
  const groupTitleMap = new Map<string, Set<string>>();
  const groupCountMap = new Map<string, number>();

  for (const match of allMatches) {
    const sportKey = match.sportId ? match.sportId.toString() : "unknown";
    const dateKey = match.matchDate ? match.matchDate.toISOString().slice(0, 10) : "unknown";
    const opponentKey = (match.opponentName || "").trim().toLowerCase();
    const groupKey = `${sportKey}_${dateKey}_${opponentKey}`;

    if (!groupTitleMap.has(groupKey)) {
      groupTitleMap.set(groupKey, new Set<string>());
      groupCountMap.set(groupKey, 0);
    }

    const seenTitles = groupTitleMap.get(groupKey)!;
    const occurrence = groupCountMap.get(groupKey)! + 1;
    groupCountMap.set(groupKey, occurrence);

    let needsSave = false;

    // Check title presence
    let currentTitle = (match.title || "").trim();
    if (!currentTitle || currentTitle === "Match Fixture") {
      if (occurrence === 1) {
        currentTitle = match.opponentName
          ? `${match.opponentName} Fixture`
          : "Match Fixture";
      } else {
        currentTitle = match.opponentName
          ? `${match.opponentName} Match ${occurrence}`
          : `Match Fixture ${occurrence}`;
      }
      match.title = currentTitle;
      needsSave = true;
    }

    // Ensure title uniqueness within the same sport, date, and opponent
    let normalizedTitle = currentTitle.toLowerCase();
    if (seenTitles.has(normalizedTitle)) {
      // Collision detected within group: append occurrence number
      currentTitle = `${currentTitle} #${occurrence}`;
      match.title = currentTitle;
      normalizedTitle = currentTitle.toLowerCase();
      needsSave = true;
    }
    seenTitles.add(normalizedTitle);

    if (match.normalizedTitle !== normalizedTitle) {
      match.normalizedTitle = normalizedTitle;
      needsSave = true;
    }

    const expectedNormalizedOpponent = (match.opponentName || "").trim().toLowerCase();
    if (match.normalizedOpponent !== expectedNormalizedOpponent) {
      match.normalizedOpponent = expectedNormalizedOpponent;
      needsSave = true;
    }

    if (needsSave) {
      await match.save();
      updatedMatches++;
    }
  }

  console.log(`✓ Evaluated ${allMatches.length} matches. Updated ${updatedMatches} records.`);

  // 3. Inspect and remove any obsolete index on (sport, date, opponent)
  const existingIndexes = await MatchModel.collection.indexes();
  const droppedObsoleteIndexes: string[] = [];

  for (const idx of existingIndexes) {
    const keys = Object.keys(idx.key || {});
    // If index has opponentName or doesn't have normalizedTitle when combining sportId, matchDate, opponent
    const isObsoleteOpponentIndex =
      keys.includes("sportId") &&
      keys.includes("matchDate") &&
      (keys.includes("opponentName") || keys.includes("normalizedOpponent")) &&
      !keys.includes("normalizedTitle");

    if (isObsoleteOpponentIndex && idx.name) {
      console.log(`Dropping obsolete index: ${idx.name}`);
      await MatchModel.collection.dropIndex(idx.name);
      droppedObsoleteIndexes.push(idx.name);
    }
  }

  // 4. Sync / build compound unique index
  console.log("Syncing compound unique index with MongoDB Atlas...");
  await MatchModel.syncIndexes();

  // 5. Verification checks
  const updatedIndexes = await MatchModel.collection.indexes();
  let compoundUniqueIndexFound = false;
  let obsoleteIndexPresent = false;

  for (const idx of updatedIndexes) {
    const keys = Object.keys(idx.key || {});
    if (
      keys.includes("sportId") &&
      keys.includes("matchDate") &&
      keys.includes("normalizedOpponent") &&
      keys.includes("normalizedTitle") &&
      idx.unique === true
    ) {
      compoundUniqueIndexFound = true;
    }
    if (
      keys.includes("sportId") &&
      keys.includes("matchDate") &&
      (keys.includes("opponentName") || keys.includes("normalizedOpponent")) &&
      !keys.includes("normalizedTitle")
    ) {
      obsoleteIndexPresent = true;
    }
  }

  // Check invalid fields
  const invalidTitleCount = await MatchModel.countDocuments({
    $or: [{ title: { $exists: false } }, { title: "" }, { title: null }],
  }).exec();

  const invalidNormalizedTitleCount = await MatchModel.countDocuments({
    $or: [{ normalizedTitle: { $exists: false } }, { normalizedTitle: "" }, { normalizedTitle: null }],
  }).exec();

  const invalidNormalizedOpponentCount = await MatchModel.countDocuments({
    $or: [{ normalizedOpponent: { $exists: false } }, { normalizedOpponent: "" }, { normalizedOpponent: null }],
  }).exec();

  const finalParticipantCount = await MatchParticipantModel.countDocuments().exec();

  console.log("\n=======================================================");
  console.log("Migration Verification Summary:");
  console.log(`- Total Matches: ${allMatches.length}`);
  console.log(`- Updated Matches: ${updatedMatches}`);
  console.log(`- Total Participants Before: ${initialParticipantCount}, After: ${finalParticipantCount}`);
  console.log(`- Invalid Titles: ${invalidTitleCount}`);
  console.log(`- Invalid Normalized Titles: ${invalidNormalizedTitleCount}`);
  console.log(`- Invalid Normalized Opponents: ${invalidNormalizedOpponentCount}`);
  console.log(`- Compound Unique Index Found: ${compoundUniqueIndexFound}`);
  console.log(`- Obsolete Index Present: ${obsoleteIndexPresent}`);
  console.log("=======================================================\n");

  return {
    totalMatches: allMatches.length,
    updatedMatches,
    totalParticipants: finalParticipantCount,
    invalidTitleCount,
    invalidNormalizedTitleCount,
    invalidNormalizedOpponentCount,
    droppedObsoleteIndexes,
    activeIndexes: updatedIndexes as Array<{ name: string; key: Record<string, unknown>; unique?: boolean }>,
    compoundUniqueIndexFound,
    obsoleteIndexPresent,
  };
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  migrateMatchTitles()
    .then((report) => {
      console.log("Migration finished successfully with report:", JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
