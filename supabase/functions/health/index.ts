/**
 * Health Check Endpoint
 * Provides application health status for monitoring and load balancers
 */

import { getCorsHeaders } from '../_shared/cors.ts'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database?: HealthCheck
    supabase?: HealthCheck
    services?: HealthCheck
  }
  uptime?: number
}

interface HealthCheck {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  message?: string
}

const startTime = Date.now()

/**
 * Check database connectivity
 */
async function checkDatabase(supabaseUrl: string, serviceRoleKey: string): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    const responseTime = Date.now() - start
    
    if (response.ok) {
      return {
        status: responseTime > 1000 ? 'degraded' : 'up',
        responseTime,
        message: responseTime > 1000 ? 'Slow response' : 'OK'
      }
    }
    
    return {
      status: 'down',
      responseTime,
      message: `HTTP ${response.status}`
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Supabase Auth
 */
async function checkSupabaseAuth(supabaseUrl: string, serviceRoleKey: string): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        'apikey': serviceRoleKey
      },
      signal: AbortSignal.timeout(5000)
    })
    
    const responseTime = Date.now() - start
    
    if (response.ok) {
      return {
        status: 'up',
        responseTime,
        message: 'OK'
      }
    }
    
    return {
      status: 'down',
      responseTime,
      message: `HTTP ${response.status}`
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const appVersion = Deno.env.get('APP_VERSION') || '1.0.0'
    
    // Basic health check without database
    if (!supabaseUrl || !serviceRoleKey) {
      const response: HealthStatus = {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        version: appVersion,
        checks: {
          services: {
            status: 'down',
            message: 'Configuration missing'
          }
        },
        uptime: Math.floor((Date.now() - startTime) / 1000)
      }
      
      return new Response(JSON.stringify(response), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Perform health checks in parallel
    const [dbCheck, authCheck] = await Promise.all([
      checkDatabase(supabaseUrl, serviceRoleKey),
      checkSupabaseAuth(supabaseUrl, serviceRoleKey)
    ])
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (dbCheck.status === 'down' || authCheck.status === 'down') {
      overallStatus = 'unhealthy'
    } else if (dbCheck.status === 'degraded' || authCheck.status === 'degraded') {
      overallStatus = 'degraded'
    }
    
    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: appVersion,
      checks: {
        database: dbCheck,
        supabase: authCheck,
        services: {
          status: 'up',
          message: 'Edge functions operational'
        }
      },
      uptime: Math.floor((Date.now() - startTime) / 1000)
    }
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 :
                      503
    
    return new Response(JSON.stringify(response), {
      status: httpStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    const response: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        services: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      uptime: Math.floor((Date.now() - startTime) / 1000)
    }
    
    return new Response(JSON.stringify(response), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
})

