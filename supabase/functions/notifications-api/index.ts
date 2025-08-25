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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'No authorization header' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Route: GET /notifications/preferences
    if (path.endsWith('/preferences') && method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/notification_preferences?user_id=eq.${userId}`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const preferences = await response.json();
      const userPrefs = preferences[0] || {
        user_id: userId,
        post_push_enabled: true,
        invite_push_enabled: true,
        quiet_start: '22:00',
        quiet_end: '07:00'
      };

      return new Response(JSON.stringify({ data: userPrefs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route: PATCH /notifications/preferences  
    if (path.endsWith('/preferences') && method === 'PATCH') {
      const updates = await req.json();
      
      // Validate updates
      const validFields = ['post_push_enabled', 'invite_push_enabled', 'quiet_start', 'quiet_end'];
      const filteredUpdates = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (validFields.includes(key)) {
          filteredUpdates[key] = value;
        }
      }

      // Upsert preferences
      const upsertData = {
        user_id: userId,
        ...filteredUpdates
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/notification_preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(upsertData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update preferences: ${errorText}`);
      }

      const updatedPrefs = await response.json();
      return new Response(JSON.stringify({ data: updatedPrefs[0] || upsertData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route: POST /notifications-api/device-token (register push device)
    if (path.endsWith('/device-token') && method === 'POST') {
      const { deviceToken, deviceType } = await req.json();
      
      if (!deviceToken) {
        throw new Error('Device token is required');
      }

      // Upsert device token
      const tokenData = {
        user_id: userId,
        fcm_token: deviceToken,
        platform: deviceType || 'web',
        last_seen: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/push_devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register device token: ${errorText}`);
      }

      return new Response(JSON.stringify({ data: { success: true } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route: GET /notifications-api (fetch user notifications)
    if (path === '/notifications-api' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const cursor = url.searchParams.get('cursor');
      
      let query = `${supabaseUrl}/rest/v1/notifications?user_id=eq.${userId}&select=*&order=created_at.desc&limit=${limit}`;
      
      if (cursor) {
        query += `&created_at=lt.${cursor}`;
      }
      
      const response = await fetch(query, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch notifications: ${errorText}`);
      }

      const notifications = await response.json();
      
      return new Response(JSON.stringify({ 
        data: notifications,
        cursor: notifications.length === limit ? notifications[notifications.length - 1].created_at : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route: GET /notifications-api/unread-count
    if (path.endsWith('/unread-count') && method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${userId}&is_read=eq.false&select=id`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch unread count: ${errorText}`);
      }

      const notifications = await response.json();
      
      return new Response(JSON.stringify({ 
        data: { unread_count: notifications.length }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default: 404 Not Found
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Notifications API error:', error);

    const errorResponse = {
      error: {
        code: 'NOTIFICATIONS_API_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
