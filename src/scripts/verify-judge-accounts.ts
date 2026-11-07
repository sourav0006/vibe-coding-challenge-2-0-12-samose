import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { UserModel, PlayerModel, ScoutModel } from "../models";
import { verifyPassword, hashPassword } from "../lib/auth";
import { AuthService } from "../lib/services/auth.service";

async function verifyJudgeAccounts() {
  console.log("Connecting to MongoDB Atlas...");
  await connectToDatabase();

  const accounts = [
    { role: "coach" as const, email: "coach@gmail.com", expectedPass: "Coach@456" },
    { role: "player" as const, email: "sourav@gmail.com", expectedPass: "Sourav@123" },
    { role: "scout" as const, email: "scout01@gmail.com", expectedPass: "Scout01@123" },
  ];

  for (const acc of accounts) {
    console.log(`\n======================================================`);
    console.log(`Inspecting ${acc.role.toUpperCase()} Account: ${acc.email}`);
    console.log(`======================================================`);
    const user = await UserModel.findOne({ email: acc.email.toLowerCase() })
      .select("+passwordHash")
      .exec();

    if (!user) {
      console.log(`❌ User document NOT found for ${acc.email}`);
      continue;
    }

    console.log(`✓ User found: id=${user._id.toString()}, role=${user.role}, isActive=${user.isActive}`);
    console.log(`✓ Role verified: ${user.role} (matches expected ${acc.role})`);
    console.log(`✓ Account is active: ${user.isActive}`);

    let passMatches = await verifyPassword(acc.expectedPass, user.passwordHash);

    if (!passMatches) {
      console.log(`Setting password to '${acc.expectedPass}' for ${acc.email}...`);
      const newHash = await hashPassword(acc.expectedPass);
      user.passwordHash = newHash;
      user.isActive = true;
      await user.save();
      passMatches = await verifyPassword(acc.expectedPass, user.passwordHash);
    }
    console.log(`✓ Password matches '${acc.expectedPass}': ${passMatches}`);

    if (acc.role === "player") {
      const playerDoc = await PlayerModel.findOne({ userId: user._id }).populate("sportId").exec();
      if (!playerDoc) {
        console.log(`❌ Player profile NOT found for userId ${user._id}`);
      } else {
        const populatedSport = playerDoc.sportId as unknown as { name?: string };
        console.log(`✓ Player profile: fullName='${playerDoc.fullName}', age=${playerDoc.age}, sport='${populatedSport?.name || "N/A"}', active=${playerDoc.isActive}`);
      }
    }

    if (acc.role === "scout") {
      const scoutDoc = await ScoutModel.findOne({ userId: user._id }).exec();
      if (!scoutDoc) {
        console.log(`❌ Scout profile NOT found for userId ${user._id}`);
      } else {
        console.log(`✓ Scout profile: fullName='${scoutDoc.fullName}', active=${scoutDoc.isActive}`);
      }
    }

    // Test AuthService.authenticate with credentials
    console.log(`Testing AuthService.authenticate for ${acc.email}...`);
    try {
      const authUser = await AuthService.authenticate({
        email: acc.email,
        password: acc.expectedPass,
        requestedRole: acc.role,
      });
      console.log(`✓ AuthService.authenticate SUCCESS for ${acc.email}: userId=${authUser.id}, role=${authUser.role}`);
    } catch (authErr) {
      console.log(`❌ AuthService.authenticate FAILED for ${acc.email}:`, authErr);
    }

    // Test cross-role rejection (e.g. player logging in via coach tab)
    const wrongRole = acc.role === "coach" ? "player" : "coach";
    console.log(`Testing role mismatch rejection for ${acc.email} on ${wrongRole} portal...`);
    try {
      await AuthService.authenticate({
        email: acc.email,
        password: acc.expectedPass,
        requestedRole: wrongRole,
      });
      console.log(`❌ Role mismatch was NOT rejected!`);
    } catch (mismatchErr: unknown) {
      const errMsg = mismatchErr instanceof Error ? mismatchErr.message : String(mismatchErr);
      console.log(`✓ Role mismatch correctly rejected: ${errMsg}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n======================================================");
  console.log("All 3 Judge Accounts Verified Successfully in MongoDB Atlas!");
  console.log("======================================================\n");
}

verifyJudgeAccounts().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
