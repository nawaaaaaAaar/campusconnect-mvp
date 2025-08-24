Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Verify the JWT token with Supabase
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseServiceRoleKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Invalid authentication token');
    }

    const user = await userResponse.json();
    const userId = user.id;

    if (req.method === 'GET') {
      // Get user profile
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.pgrst.object+json',
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(`Failed to fetch profile: ${errorText}`);
      }

      const profiles = await profileResponse.json();
      const profile = Array.isArray(profiles) ? profiles[0] : profiles;

      return new Response(JSON.stringify({ data: profile || null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Create or update user profile
      const requestData = await req.json();
      const { display_name, bio, avatar_url, campus, year, interests, account_type } = requestData;

      const profileData = {
        user_id: userId,
        email: user.email,
        display_name,
        bio,
        avatar_url,
        campus,
        year,
        interests,
        account_type: account_type || 'student',
        profile_complete: !!(display_name && campus),
        updated_at: new Date().toISOString()
      };

      // Check if profile already exists
      const existingResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Content-Type': 'application/json',
        },
      });

      const existingProfiles = await existingResponse.json();
      const hasExistingProfile = Array.isArray(existingProfiles) && existingProfiles.length > 0;

      let response;
      if (hasExistingProfile) {
        // Update existing profile
        response = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(profileData)
        });
      } else {
        // Create new profile
        response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(profileData)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save profile: ${errorText}`);
      }

      const savedProfile = await response.json();
      const profile = Array.isArray(savedProfile) ? savedProfile[0] : savedProfile;

      return new Response(JSON.stringify({ data: profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Unsupported method: ${req.method}`);

  } catch (error) {
    console.error('Profile management error:', error);
    const errorResponse = {
      error: {
        code: 'PROFILE_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
