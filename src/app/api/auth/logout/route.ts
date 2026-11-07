import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();

  const response = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully",
    },
    { status: 200 }
  );

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
