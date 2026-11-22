import { NextRequest } from "next/server";
import { getBenchmarks } from "@/services/benchmark.service";
import { successResponse, handleServerError } from "@/lib/api-response";

export const instant = false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || undefined;
    const category = searchParams.get("category") || undefined;
    const includeAllScores =
      searchParams.get("includeAllScores") === "true" || searchParams.has("full");

    const benchmarks = await getBenchmarks({
      slug,
      category,
      includeAllScores,
    });

    return successResponse(benchmarks);
  } catch (error) {
    return handleServerError(error, "Failed to retrieve benchmarks");
  }
}
