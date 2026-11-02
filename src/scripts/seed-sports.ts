import dotenv from "dotenv";
import path from "node:path";
import mongoose from "mongoose";

// Load environment variables from .env.local first, falling back to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../lib/db/connection";
import { SportModel } from "../models/sport.model";

export const INITIAL_SPORTS = [
  {
    name: "Football",
    description: "Association football academy program, drills, tactical coaching, and competitive fixtures.",
  },
  {
    name: "Cricket",
    description: "Cricket academy training, batting and bowling practice, nets, and competitive matches.",
  },
  {
    name: "Basketball",
    description: "Basketball skills development, scrimmages, court positioning, and league tournaments.",
  },
  {
    name: "Volleyball",
    description: "Volleyball team training, setting, spiking drills, and tournament matches.",
  },
  {
    name: "Badminton",
    description: "Badminton singles and doubles training, agility, footwork drills, and academy tournaments.",
  },
] as const;

export async function seedSportsCatalogue() {
  console.log("=========================================");
  console.log("One Academy: Sports Catalogue Seed Script");
  console.log("=========================================");

  if (!process.env.MONGODB_URI) {
    console.error(
      "Configuration Error: MONGODB_URI is not set in environment or .env.local. Aborting seed."
    );
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await connectToDatabase();
    console.log("Connected successfully.\n");

    let createdCount = 0;
    let existingCount = 0;

    for (const sport of INITIAL_SPORTS) {
      const normalizedName = sport.name.trim().toLowerCase();

      const existing = await SportModel.findOne({ normalizedName }).exec();

      if (existing) {
        existingCount++;
        console.log(`[EXISTS]  Sport "${sport.name}" (normalized: "${normalizedName}") is already in the database.`);
      } else {
        await SportModel.create({
          name: sport.name.trim(),
          normalizedName,
          description: sport.description,
          isActive: true,
        });
        createdCount++;
        console.log(`[CREATED] Sport "${sport.name}" created successfully.`);
      }
    }

    console.log("\n-----------------------------------------");
    console.log(`Result: ${createdCount} created, ${existingCount} already existed (Idempotent).`);
    console.log("-----------------------------------------");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Seed execution failed:", message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.includes("seed-sports")) {
  seedSportsCatalogue();
}
