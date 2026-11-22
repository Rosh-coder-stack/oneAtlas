import { getProviders } from "@/services/provider.service";
import { successResponse, handleServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const providers = await getProviders();
    return successResponse(providers);
  } catch (error) {
    return handleServerError(error, "Failed to retrieve providers");
  }
}
