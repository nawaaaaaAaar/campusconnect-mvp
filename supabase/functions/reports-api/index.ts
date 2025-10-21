// PRD 5.8: Reports API
// Handles content reporting for moderation

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing')
  }

  try {
    const method = req.method
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /reports-api - Create a new report
    if (method === 'POST') {
      const { target_type, target_id, reason, description } = await req.json()

      // Validate required fields
      if (!target_type || !target_id || !reason) {
        return new Response(JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: target_type, target_id, reason'
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate target_type
      const validTargetTypes = ['post', 'comment', 'society', 'user']
      if (!validTargetTypes.includes(target_type)) {
        return new Response(JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid target_type. Must be: post, comment, society, or user'
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get authenticated user
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': authHeader,
          'apikey': serviceRoleKey
        }
      })

      if (!userResponse.ok) {
        return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { id: userId } = await userResponse.json()

      // Check if user has already reported this target (prevent spam)
      const existingReportResponse = await fetch(
        `${supabaseUrl}/rest/v1/reports?reporter_id=eq.${userId}&target_type=eq.${target_type}&target_id=eq.${target_id}&select=id`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      )

      const existingReports = await existingReportResponse.json()
      
      if (existingReports.length > 0) {
        return new Response(JSON.stringify({
          error: {
            code: 'DUPLICATE_REPORT',
            message: 'You have already reported this content'
          }
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create report
      const reportData = {
        reporter_id: userId,
        target_type,
        target_id,
        reason,
        description: description || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const createResponse = await fetch(`${supabaseUrl}/rest/v1/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(reportData)
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Failed to create report: ${errorText}`)
      }

      const report = await createResponse.json()

      return new Response(JSON.stringify({
        data: report[0],
        message: 'Report submitted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Reports API error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})



