import { getCorsHeaders, handleCors } from '../_shared/cors.ts'
import { checkRateLimit, createRateLimitResponse, getRateLimitIdentifier, rateLimitConfigs } from '../_shared/ratelimit.ts'
import { requireAuth } from '../_shared/auth.ts'
import { createErrorResponse, ErrorCode, handleDatabaseError } from '../_shared/errors.ts'

interface TelemetryEvent {
  event: string
  ts: string
  user_id?: string
  institute_id?: string
  society_id?: string
  post_id?: string
  device: string
  app_version: string
  latency_ms?: number
  post_count?: number
  feed_type?: string
  reason?: string
  metadata?: Record<string, any>
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return createErrorResponse(
        ErrorCode.CONFIG_ERROR,
        'Supabase configuration missing',
        corsHeaders
      )
    }

    // Get user from auth (optional for some events)
    let user = null
    let userId = null
    try {
      user = await requireAuth(req, supabaseUrl, serviceRoleKey, corsHeaders)
      userId = user.id
    } catch (error) {
      // Allow anonymous events but log them
      console.log('Anonymous analytics event received')
    }

    // Apply rate limiting if user is authenticated
    if (userId) {
      const rateLimitKey = getRateLimitIdentifier(req, userId)
      const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfigs.analytics)
      
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit, corsHeaders)
      }
    }

    if (req.method === 'POST') {
      try {
        const events: TelemetryEvent[] = await req.json()
        
        if (!Array.isArray(events) || events.length === 0) {
          return createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Events array is required',
            corsHeaders
          )
        }

        if (events.length > 100) {
          return createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Maximum 100 events per batch',
            corsHeaders
          )
        }

        // Prepare events for insertion
        const eventsToInsert = events.map(event => ({
          ...event,
          user_id: userId || event.user_id || null,
          created_at: new Date().toISOString()
        }))

        // Insert events into database
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(eventsToInsert)
        })

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text()
          console.error('Failed to insert analytics events:', errorText)
          // Don't fail the request for analytics, just log it
          console.warn('Analytics events insertion failed, but continuing...')
        }

        return new Response(JSON.stringify({ 
          success: true,
          processed: eventsToInsert.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (error) {
        console.error('Analytics POST error:', error)
        // Don't fail the request for analytics errors
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Analytics processing failed',
          details: error.message 
        }), {
          status: 200, // Return 200 to avoid breaking the app
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (req.method === 'GET') {
      try {
        // Only allow admins to query analytics
        if (!userId) {
          return createErrorResponse(
            ErrorCode.UNAUTHORIZED,
            'Authentication required',
            corsHeaders
          )
        }

        // Check if user is admin
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${userId}&is_active=eq.true&select=role`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        })

        if (!adminCheckResponse.ok) {
          return createErrorResponse(
            ErrorCode.FORBIDDEN,
            'Admin access required',
            corsHeaders
          )
        }

        const adminData = await adminCheckResponse.json()
        if (adminData.length === 0) {
          return createErrorResponse(
            ErrorCode.FORBIDDEN,
            'Admin access required',
            corsHeaders
          )
        }

        const url = new URL(req.url)
        const eventType = url.searchParams.get('event_type')
        const limit = parseInt(url.searchParams.get('limit') || '100')
        const since = url.searchParams.get('since')

        let query = `select=*&order=created_at.desc&limit=${limit}`
        
        if (eventType) {
          query += `&event=eq.${eventType}`
        }
        
        if (since) {
          query += `&created_at=gte.${since}`
        }

        const analyticsResponse = await fetch(`${supabaseUrl}/rest/v1/analytics_events?${query}`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        })

        if (!analyticsResponse.ok) {
          const errorText = await analyticsResponse.text()
          return createErrorResponse(
            ErrorCode.DATABASE_ERROR,
            'Failed to fetch analytics',
            corsHeaders
          )
        }

        const analytics = await analyticsResponse.json()

        return new Response(JSON.stringify({ data: analytics }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (error) {
        console.error('Analytics GET error:', error)
        return createErrorResponse(
          ErrorCode.INTERNAL_SERVER_ERROR,
          'Failed to fetch analytics',
          corsHeaders
        )
      }
    }

    return new Response(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Analytics service error',
      corsHeaders
    )
  }
})
