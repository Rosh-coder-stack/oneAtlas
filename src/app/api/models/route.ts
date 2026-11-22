import { NextRequest } from "next/server";
import { getModels, GetModelsParams } from "@/services/model.service";
import { successResponse, clientErrorResponse, handleServerError } from "@/lib/api-response";

const ALLOWED_SORT_FIELDS = [
  "input_price",
  "output_price",
  "context_window",
  "release_date",
  "name",
  "created_at",
] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Search Query Parameter
    const search = searchParams.get("search") || undefined;

    // 2. Filter Parameters
    const provider = searchParams.get("provider") || undefined;
    const category = searchParams.get("category") || undefined;
    const license = searchParams.get("license") || undefined;

    // OpenWeights boolean parsing
    let openWeights: boolean | undefined = undefined;
    const openWeightsRaw = searchParams.get("openWeights");
    if (openWeightsRaw !== null) {
      if (openWeightsRaw === "true" || openWeightsRaw === "1") {
        openWeights = true;
      } else if (openWeightsRaw === "false" || openWeightsRaw === "0") {
        openWeights = false;
      } else {
        return clientErrorResponse(
          "Invalid 'openWeights' parameter. Expected 'true', 'false', '1', or '0'.",
          400,
          "INVALID_PARAM"
        );
      }
    }

    // 3. Sorting Parameters & Validation
    const sortByRaw = searchParams.get("sortBy")?.toLowerCase();
    let sortBy: GetModelsParams["sortBy"] = undefined;
    if (sortByRaw) {
      if (!ALLOWED_SORT_FIELDS.includes(sortByRaw as (typeof ALLOWED_SORT_FIELDS)[number])) {
        return clientErrorResponse(
          `Invalid 'sortBy' parameter. Allowed values: ${ALLOWED_SORT_FIELDS.join(", ")}.`,
          400,
          "INVALID_SORT_FIELD"
        );
      }
      sortBy = sortByRaw as GetModelsParams["sortBy"];
    }

    const sortOrderRaw = searchParams.get("sortOrder")?.toLowerCase();
    let sortOrder: "asc" | "desc" | undefined = undefined;
    if (sortOrderRaw) {
      if (sortOrderRaw !== "asc" && sortOrderRaw !== "desc") {
        return clientErrorResponse(
          "Invalid 'sortOrder' parameter. Allowed values: 'asc' or 'desc'.",
          400,
          "INVALID_SORT_ORDER"
        );
      }
      sortOrder = sortOrderRaw;
    }

    // 4. Pagination Parameters & Validation
    const pageRaw = searchParams.get("page");
    let page = 1;
    if (pageRaw !== null) {
      const parsedPage = Number(pageRaw);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return clientErrorResponse(
          "Invalid 'page' parameter. Must be a positive integer greater than or equal to 1.",
          400,
          "INVALID_PAGE"
        );
      }
      page = parsedPage;
    }

    const limitRaw = searchParams.get("limit");
    let limit = 10;
    if (limitRaw !== null) {
      const parsedLimit = Number(limitRaw);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return clientErrorResponse(
          "Invalid 'limit' parameter. Must be an integer between 1 and 50.",
          400,
          "INVALID_LIMIT"
        );
      }
      limit = parsedLimit;
    }

    // 5. Execute Service Query
    const { models, pagination } = await getModels({
      search,
      provider,
      category,
      license,
      openWeights,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return successResponse(models, pagination);
  } catch (error) {
    return handleServerError(error, "Failed to retrieve models");
  }
}
