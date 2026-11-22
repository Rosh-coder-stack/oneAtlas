import { NextResponse } from "next/server";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;

/**
 * Return a standardized 2xx success response.
 */
export function successResponse<T>(
  data: T,
  pagination?: PaginationMeta,
  status = 200
): NextResponse<ApiSuccessBody<T>> {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
  };
  return NextResponse.json(body, { status });
}

/**
 * Return a standardized client or validation error response (4xx).
 */
export function clientErrorResponse(
  message: string,
  statusCode = 400,
  code = "BAD_REQUEST",
  details?: unknown
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status: statusCode }
  );
}

/**
 * Securely handles internal and database errors, ensuring no credentials or stack traces leak.
 */
export function handleServerError(
  error: unknown,
  contextMessage = "An unexpected error occurred while processing your request."
): NextResponse<ApiErrorBody> {
  // Allow Next.js internal dynamic bailout errors to bubble up during static generation
  if (
    error instanceof Error &&
    (error.message.includes("bail out of prerendering") ||
      error.message.includes("DYNAMIC_SERVER_USAGE"))
  ) {
    throw error;
  }

  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.includes("DYNAMIC")
  ) {
    throw error;
  }

  // Safe server-side logging without credential exposure
  console.error(`[Server Error] ${contextMessage}:`, error instanceof Error ? error.message : error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error. Please try again later.",
      },
    },
    { status: 500 }
  );
}
