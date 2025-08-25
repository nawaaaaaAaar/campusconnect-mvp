const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: { code: 'CONFIG_ERROR', message: 'Supabase configuration missing' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the JWT and get user using REST API
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': serviceRoleKey
      }
    });
    
    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: { code: 'INVALID_JWT', message: 'Invalid or expired token' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const userData = await userResponse.json();
    const userId = userData.id;

    if (req.method === 'GET') {
      try {
        // First try to get existing profile
        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });
        
        let profile = null;
        if (profileResponse.ok) {
          const profiles = await profileResponse.json();
          profile = profiles?.[0] || null;
        }
        
        // If no profile exists, create one (trigger should handle this, but fallback)
        if (!profile) {
          const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              id: userId,
              email: userData.email || '',
              account_type: userData.app_metadata?.account_type || 'student',
              name: userData.user_metadata?.name || userData.user_metadata?.full_name || null,
              avatar_url: userData.user_metadata?.avatar_url || null,
              created_at: userData.created_at
            })
          });
          
          if (createProfileResponse.ok) {
            const createdProfiles = await createProfileResponse.json();
            profile = createdProfiles?.[0];
          } else {
            // If creation fails, it might already exist due to race condition
            const retryResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
              }
            });
            
            if (retryResponse.ok) {
              const retryProfiles = await retryResponse.json();
              profile = retryProfiles?.[0] || null;
            }
          }
        }
        
        if (!profile) {
          return new Response(JSON.stringify({ 
            error: { 
              code: 'PROFILE_CREATE_ERROR', 
              message: 'Failed to create or fetch user profile' 
            } 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get society memberships
        const membershipsResponse = await fetch(`${supabaseUrl}/rest/v1/society_members?user_id=eq.${userId}&select=society_id,role,joined_at,societies(id,name,institute_id)`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });
        
        const memberships = membershipsResponse.ok ? await membershipsResponse.json() : [];
        
        // Get society follows
        const followsResponse = await fetch(`${supabaseUrl}/rest/v1/society_follows?user_id=eq.${userId}&select=society_id,societies(id,name,institute_id)`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });
        
        const follows = followsResponse.ok ? await followsResponse.json() : [];
        
        // Add stats and relationships
        const profileData = {
          ...profile,
          society_memberships: memberships,
          society_follows: follows,
          stats: {
            societies_member_of: memberships.length,
            societies_following: follows.length
          }
        };
        
        return new Response(JSON.stringify({ data: profileData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Profile fetch error:', error);
        return new Response(JSON.stringify({ 
          error: { 
            code: 'PROFILE_FETCH_ERROR', 
            message: 'Failed to fetch user profile',
            details: error.message 
          } 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (req.method === 'PUT') {
      try {
        const requestData = await req.json();
        const { name, avatar_url, institute, course } = requestData;

        // Update profile
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name,
            avatar_url,
            institute,
            course,
            updated_at: new Date().toISOString()
          })
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          return new Response(JSON.stringify({ 
            error: { 
              code: 'PROFILE_UPDATE_ERROR', 
              message: 'Failed to update user profile',
              details: errorText 
            } 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const updatedProfiles = await updateResponse.json();
        const updatedProfile = updatedProfiles?.[0];

        return new Response(JSON.stringify({ data: updatedProfile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Profile update error:', error);
        return new Response(JSON.stringify({ 
          error: { 
            code: 'PROFILE_UPDATE_ERROR', 
            message: 'Failed to update user profile',
            details: error.message 
          } 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle following societies endpoint
    if (req.method === 'GET' && req.url.includes('/following')) {
      try {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const cursor = url.searchParams.get('cursor');

        let query = `user_id=eq.${userId}&select=society_id,created_at,societies(id,name,institute_id,category,description,verified)&order=created_at.desc&limit=${limit}`;
        if (cursor) {
          query += `&created_at=lt.${cursor}`;
        }

        const followsResponse = await fetch(`${supabaseUrl}/rest/v1/society_follows?${query}`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });

        if (!followsResponse.ok) {
          const errorText = await followsResponse.text();
          return new Response(JSON.stringify({ 
            error: { 
              code: 'FOLLOWING_FETCH_ERROR', 
              message: 'Failed to fetch following societies',
              details: errorText 
            } 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const follows = await followsResponse.json();
        const societies = follows?.map(follow => follow.societies) || [];
        const nextCursor = follows && follows.length === limit ? follows[follows.length - 1].created_at : null;

        return new Response(JSON.stringify({ 
          data: societies,
          cursor: nextCursor
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Following societies fetch error:', error);
        return new Response(JSON.stringify({ 
          error: { 
            code: 'FOLLOWING_FETCH_ERROR', 
            message: 'Failed to fetch following societies',
            details: error.message 
          } 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
