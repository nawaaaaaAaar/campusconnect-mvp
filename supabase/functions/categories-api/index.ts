// PRD 3.3: Categories API
// Provides list of all society categories

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

    // GET /categories-api - List all categories
    if (method === 'GET') {
      // Fetch categories from database
      const categoriesResponse = await fetch(
        `${supabaseUrl}/rest/v1/categories?select=*&order=display_order.asc`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      )

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories')
      }

      const categories = await categoriesResponse.json()

      // Get society counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: any) => {
          const countResponse = await fetch(
            `${supabaseUrl}/rest/v1/societies?category=eq.${category.name}&select=id`,
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
            ...category,
            societies_count
          }
        })
      )

      return new Response(JSON.stringify({ data: categoriesWithCounts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Categories API error:', error)

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



