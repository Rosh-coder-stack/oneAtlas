import { NextRequest } from "next/server";
import { getModelBySlug } from "@/services/model.service";
import { successResponse, clientErrorResponse, handleServerError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return clientErrorResponse("A valid model slug must be provided.", 400, "INVALID_SLUG");
    }

    const sanitizedSlug = slug.trim().toLowerCase();
    const model = await getModelBySlug(sanitizedSlug);

    if (!model) {
      return clientErrorResponse(
        `Model with slug '${sanitizedSlug}' was not found.`,
        404,
        "MODEL_NOT_FOUND"
      );
    }

    return successResponse(model);
  } catch (error) {
    return handleServerError(error, "Failed to retrieve model details");
  }
}
