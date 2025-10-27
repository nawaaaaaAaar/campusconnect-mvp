/**
 * CORS Configuration for Supabase Edge Functions
 * Production-grade CORS settings with environment-specific origins
 */

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS')
  
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim())
  }
  
  // Default allowed origins for development
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://campusconnect-mvp.vercel.app', // Production domain
    'https://campusconnect.vercel.app', // Alternative domain
  ]
  
  // In production, allow all vercel.app and netlify.app subdomains
  if (Deno.env.get('ENVIRONMENT') === 'production') {
    defaultOrigins.push('https://*.vercel.app', 'https://*.netlify.app')
  }
  
  return defaultOrigins
}

/**
 * Get CORS headers based on request origin
 * Only allows whitelisted origins in production
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  const isProd = Deno.env.get('ENVIRONMENT') === 'production'
  
  // Default headers
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  }
  
  // In production, handle wildcards and specific domains
  if (isProd && requestOrigin) {
    // Check exact matches first
    if (allowedOrigins.includes(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin
      headers['Vary'] = 'Origin'
    } 
    // Check wildcard patterns for vercel and netlify
    else if (requestOrigin.includes('vercel.app') || requestOrigin.includes('netlify.app')) {
      headers['Access-Control-Allow-Origin'] = requestOrigin
      headers['Vary'] = 'Origin'
    }
    else {
      // Allow localhost for development even in prod mode
      if (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')) {
        headers['Access-Control-Allow-Origin'] = requestOrigin
        headers['Vary'] = 'Origin'
      } else {
        // Don't set CORS headers for non-whitelisted origins
        console.warn(`Blocked CORS request from unauthorized origin: ${requestOrigin}`)
        return {}
      }
    }
  } else if (!isProd) {
    // Development: allow all origins but log them
    headers['Access-Control-Allow-Origin'] = requestOrigin || '*'
    console.log(`Development mode: Allowing CORS from ${requestOrigin || 'any origin'}`)
  } else {
    // No origin header - allow first whitelisted origin as fallback
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0]
  }
  
  return headers
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)
    
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }
  
  return null
}

/**
 * Simple CORS headers for backward compatibility
 * Use getCorsHeaders() for more sophisticated origin validation
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
}
