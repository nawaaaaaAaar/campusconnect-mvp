// PRD 3.3: Institutes API
// Provides list of educational institutions with search support

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
    const url = new URL(req.url)

    // GET /institutes-api - List all institutes with optional search
    if (method === 'GET') {
      const search = url.searchParams.get('search')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const cursor = url.searchParams.get('cursor')

      // Build query
      let query = `${supabaseUrl}/rest/v1/institutes?select=*&order=name.asc&limit=${limit}`

      // Add search filter if provided
      if (search && search.trim()) {
        const searchTerm = encodeURIComponent(search.trim())
        query += `&or=(name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%)`
      }

      // Add cursor for pagination
      if (cursor) {
        query += `&id=gt.${cursor}`
      }

      // Fetch institutes from database
      const institutesResponse = await fetch(query, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'count=exact'
        }
      })

      if (!institutesResponse.ok) {
        throw new Error('Failed to fetch institutes')
      }

      const institutes = await institutesResponse.json()
      const totalCount = institutesResponse.headers.get('Content-Range')?.split('/')[1]

      // Get society counts for each institute
      const institutesWithCounts = await Promise.all(
        institutes.map(async (institute: any) => {
          const countResponse = await fetch(
            `${supabaseUrl}/rest/v1/societies?institute_id=eq.${institute.id}&select=id`,
            {
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
              }
            }
          )

          const countHeader = countResponse.headers.get('Content-Range')
          const societies_count = countHeader ? parseInt(countHeader.split('/')[1]) : 0

          return {
            ...institute,
            societies_count
          }
        })
      )

      // Determine next cursor
      let next_cursor = null
      if (institutes.length === limit) {
        next_cursor = institutes[institutes.length - 1].id
      }

      return new Response(JSON.stringify({
        data: institutesWithCounts,
        pagination: {
          next_cursor,
          total_count: totalCount ? parseInt(totalCount) : institutes.length
        }
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
    console.error('Institutes API error:', error)

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



