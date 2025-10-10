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
  return [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://campusconnect.vercel.app', // Production domain
  ]
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  }
  
  // In production, only allow whitelisted origins
  if (isProd && requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin
      headers['Vary'] = 'Origin'
    } else {
      // Don't set CORS headers for non-whitelisted origins
      console.warn(`Blocked CORS request from unauthorized origin: ${requestOrigin}`)
      return {}
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

