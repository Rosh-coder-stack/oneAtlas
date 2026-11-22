import { getCategories } from "@/services/category.service";
import { successResponse, handleServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const categories = await getCategories();
    return successResponse(categories);
  } catch (error) {
    return handleServerError(error, "Failed to retrieve categories");
  }
}
