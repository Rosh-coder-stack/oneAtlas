import { NextRequest } from "next/server";
import { getProviderBySlug } from "@/services/provider.service";
import { successResponse, clientErrorResponse, handleServerError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return clientErrorResponse("A valid provider slug must be provided.", 400, "INVALID_SLUG");
    }

    const sanitizedSlug = slug.trim().toLowerCase();
    const provider = await getProviderBySlug(sanitizedSlug);

    if (!provider) {
      return clientErrorResponse(
        `Provider with slug '${sanitizedSlug}' was not found.`,
        404,
        "PROVIDER_NOT_FOUND"
      );
    }

    return successResponse(provider);
  } catch (error) {
    return handleServerError(error, "Failed to retrieve provider details");
  }
}
