import { NextResponse } from "next/server";
import { connectToDatabase, getDatabaseConnectionState } from "@/lib/db";

export async function GET() {
  let dbStatus = getDatabaseConnectionState();

  // If not currently connected, attempt connection if MONGODB_URI is provided
  if (dbStatus !== "connected" && process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      dbStatus = getDatabaseConnectionState();
    } catch {
      dbStatus = "disconnected";
    }
  }

  if (dbStatus === "connected") {
    return NextResponse.json(
      {
        status: "ok",
        app: "One Academy",
        database: "connected",
      },
      { status: 200 }
    );
  }

  // Return degraded status when database is disconnected or unconfigured
  return NextResponse.json(
    {
      status: "degraded",
      app: "One Academy",
      database: dbStatus,
      message: process.env.MONGODB_URI
        ? "Database connection unavailable."
        : "Database is unconfigured (missing MONGODB_URI).",
    },
    { status: 503 }
  );
}
