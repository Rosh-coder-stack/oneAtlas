import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "connected";
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: unknown) {
    dbStatus = "disconnected";
    dbError = err instanceof Error ? err.message : "Unknown database error";
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    platform: "OneAtlas",
    version: "0.1.0",
    framework: "Next.js 16 App Router",
    runtime: "Node.js",
    database: {
      provider: "postgresql",
      engine: "PostgreSQL 16 (Docker)",
      orm: "prisma",
      status: dbStatus,
      ...(dbError ? { error: dbError } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}
