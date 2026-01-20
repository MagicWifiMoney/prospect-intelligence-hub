import { NextResponse } from 'next/server'

/**
 * Secure error response handler that logs errors server-side
 * while returning generic messages to clients.
 *
 * This prevents stack traces and internal details from leaking to clients.
 */
export function apiErrorResponse(
  error: unknown,
  context: string,
  customMessage?: string
): NextResponse {
  // Log the full error server-side for debugging
  console.error(`[API Error] ${context}:`, error)

  // Return generic message to client (no stack traces or internal details)
  return NextResponse.json(
    { error: customMessage || 'An internal error occurred' },
    { status: 500 }
  )
}

/**
 * Structured error for validation failures
 */
export function validationErrorResponse(
  message: string = 'Invalid parameters'
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}

/**
 * Unauthorized error response
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

/**
 * Not found error response
 */
export function notFoundResponse(
  resource: string = 'Resource'
): NextResponse {
  return NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  )
}
