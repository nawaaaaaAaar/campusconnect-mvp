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

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Get environment variables
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

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

    try {
        // Route handling
        if (path === '/notifications-api/preferences' && method === 'GET') {
            // Get user notification preferences
            const response = await fetch(`${supabaseUrl}/rest/v1/notification_preferences?user_id=eq.${userId}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const preferences = await response.json();
            const userPrefs = preferences[0] || {
                user_id: userId,
                post_likes: true,
                post_comments: true,
                new_followers: true,
                society_invites: true,
                society_posts: true,
                quiet_hours_start: '22:00',
                quiet_hours_end: '07:00',
                enabled: true
            };

            return new Response(JSON.stringify({ data: userPrefs }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path === '/notifications-api/preferences' && method === 'PATCH') {
            // Update notification preferences
            const updates = await req.json();
            
            // Validate updates
            const validFields = ['post_likes', 'post_comments', 'new_followers', 'society_invites', 'society_posts', 'quiet_hours_start', 'quiet_hours_end', 'enabled'];
            const filteredUpdates = {};
            
            for (const [key, value] of Object.entries(updates)) {
                if (validFields.includes(key)) {
                    filteredUpdates[key] = value;
                }
            }

            // Upsert preferences
            const upsertData = {
                user_id: userId,
                ...filteredUpdates,
                updated_at: new Date().toISOString()
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

        } else if (path === '/notifications-api/device-token' && method === 'POST') {
            // Register device token for push notifications
            const { deviceToken, deviceType } = await req.json();
            
            if (!deviceToken) {
                throw new Error('Device token is required');
            }

            // Upsert device token
            const tokenData = {
                user_id: userId,
                device_token: deviceToken,
                device_type: deviceType || 'web',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/device_tokens`, {
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

        } else if (path === '/notifications-api' && method === 'GET') {
            // Get user notifications
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

            const notifications = await response.json();
            
            // Mark as read
            if (notifications.length > 0) {
                const notificationIds = notifications.map(n => n.id);
                await fetch(`${supabaseUrl}/rest/v1/notifications`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_read: true }),
                    // Use the correct filter syntax for Supabase
                }).then(response => {
                    const filterHeader = notificationIds.map(id => `id.eq.${id}`).join(',');
                    return fetch(`${supabaseUrl}/rest/v1/notifications?or=(${filterHeader})`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ is_read: true })
                    });
                }).catch(error => {
                    console.log('Failed to mark notifications as read:', error);
                });
            }

            const nextCursor = notifications.length === limit ? notifications[notifications.length - 1].created_at : null;

            return new Response(JSON.stringify({ 
                data: notifications,
                cursor: nextCursor,
                meta: {
                    total_returned: notifications.length,
                    has_more: notifications.length === limit
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path === '/notifications-api/unread-count' && method === 'GET') {
            // Get unread notifications count
            const response = await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${userId}&is_read=eq.false&select=id`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const notifications = await response.json();
            const unreadCount = notifications.length;

            return new Response(JSON.stringify({ data: { unread_count: unreadCount } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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