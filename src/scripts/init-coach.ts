import dotenv from "dotenv";
import path from "node:path";
import mongoose from "mongoose";

// Load environment variables from .env.local first, falling back to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../lib/db/connection";
import { AuthService } from "../lib/services/auth.service";

export async function runInitCoach() {
  console.log("=========================================");
  console.log("One Academy: Coach Provisioning Script");
  console.log("=========================================");

  const email = process.env.COACH_EMAIL;
  const password = process.env.COACH_PASSWORD;

  if (!email || !password) {
    console.error(
      "Configuration Error: Both COACH_EMAIL and COACH_PASSWORD must be configured in your environment or .env.local."
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Security Error: COACH_PASSWORD must be at least 8 characters long.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await connectToDatabase();
    console.log("Connected successfully.");

    const result = await AuthService.initializeCoach(email, password);

    console.log("\n-----------------------------------------");
    console.log(`Status:  ${result.message}`);
    console.log(`Email:   ${result.email}`);
    console.log(`Created: ${result.created}`);
    console.log("-----------------------------------------");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Coach provisioning failed:", message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.includes("init-coach")) {
  runInitCoach();
}
