/**
 * Standardized Error Handling for Edge Functions
 * Provides consistent error responses and logging
 */

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp?: string
  }
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  
  // Method errors
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
}

/**
 * HTTP status codes for errors
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_FIELD]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.CONFIG_ERROR]: 500,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.ROUTE_NOT_FOUND]: 404,
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  corsHeaders: Record<string, string>,
  details?: any
): Response {
  const status = ERROR_STATUS_MAP[code] || 500
  
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  }
  
  // Only include details in development
  if (details && Deno.env.get('ENVIRONMENT') !== 'production') {
    errorResponse.error.details = details
  }
  
  // Log error
  console.error(`[${code}] ${message}`, details || '')
  
  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Create validation error response
 */
export function createValidationError(
  errors: string[],
  corsHeaders: Record<string, string>
): Response {
  return createErrorResponse(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    corsHeaders,
    { errors }
  )
}

/**
 * Safely handle async operations with error catching
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    console.error(errorMessage, error)
    return { success: false, error: error as Error }
  }
}

/**
 * Handle database errors
 */
export function handleDatabaseError(
  error: any,
  corsHeaders: Record<string, string>,
  operation: string = 'Database operation'
): Response {
  console.error(`Database error during ${operation}:`, error)
  
  // Check for common database errors
  if (error.code === '23505') {
    // Unique violation
    return createErrorResponse(
      ErrorCode.ALREADY_EXISTS,
      'Resource already exists',
      corsHeaders
    )
  }
  
  if (error.code === '23503') {
    // Foreign key violation
    return createErrorResponse(
      ErrorCode.INVALID_REQUEST,
      'Referenced resource does not exist',
      corsHeaders
    )
  }
  
  // Generic database error
  return createErrorResponse(
    ErrorCode.DATABASE_ERROR,
    `${operation} failed`,
    corsHeaders,
    Deno.env.get('ENVIRONMENT') !== 'production' ? error.message : undefined
  )
}

/**
 * Wrap handler with try-catch and standard error handling
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
  corsHeaders: Record<string, string>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('Unhandled error in request handler:', error)
      
      return createErrorResponse(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred',
        corsHeaders,
        Deno.env.get('ENVIRONMENT') !== 'production' ? (error as Error).message : undefined
      )
    }
  }
}

/**
 * Assert condition or throw error response
 */
export function assert(
  condition: boolean,
  code: ErrorCode,
  message: string,
  details?: any
): asserts condition {
  if (!condition) {
    throw new Error(JSON.stringify({ code, message, details }))
  }
}

