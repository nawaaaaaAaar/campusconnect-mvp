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

    // Check if user is admin (you can implement admin role check here)
    // For now, we'll assume all users can access basic admin features
    // In production, you would check against an admin_users table or role system

    try {
        if (path === '/admin-api/societies/verification-requests' && method === 'GET') {
            // Get pending society verification requests
            const response = await fetch(`${supabaseUrl}/rest/v1/societies?verified=eq.false&select=*,society_members(count)`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const societies = await response.json();
            
            return new Response(JSON.stringify({ data: societies }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path.match(/\/admin-api\/societies\/([a-f0-9-]+)\/verify$/) && method === 'POST') {
            // Verify a society
            const societyId = path.split('/')[3];
            const { approved, reason } = await req.json();

            const updateData = {
                verified: approved,
                verification_date: approved ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/societies?id=eq.${societyId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update society: ${errorText}`);
            }

            // Log verification action
            const auditLog = {
                user_id: userId,
                action: 'society_verification',
                target_type: 'society',
                target_id: societyId,
                details: { approved, reason },
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(auditLog)
            });

            return new Response(JSON.stringify({ data: { success: true } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path === '/admin-api/reports' && method === 'GET') {
            // Get content reports
            const status = url.searchParams.get('status') || 'pending';
            
            const response = await fetch(`${supabaseUrl}/rest/v1/reports?status=eq.${status}&select=*&order=created_at.desc`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const reports = await response.json();
            
            return new Response(JSON.stringify({ data: reports }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path.match(/\/admin-api\/reports\/([a-f0-9-]+)\/resolve$/) && method === 'POST') {
            // Resolve a report
            const reportId = path.split('/')[3];
            const { action, reason } = await req.json();

            const updateData = {
                status: 'resolved',
                resolution_action: action,
                resolution_reason: reason,
                resolved_by: userId,
                resolved_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${reportId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to resolve report: ${errorText}`);
            }

            // Log moderation action
            const auditLog = {
                user_id: userId,
                action: 'report_resolution',
                target_type: 'report',
                target_id: reportId,
                details: { action, reason },
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(auditLog)
            });

            return new Response(JSON.stringify({ data: { success: true } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path === '/admin-api/users' && method === 'GET') {
            // Get user directory
            const limit = parseInt(url.searchParams.get('limit') || '50');
            const search = url.searchParams.get('search');
            
            let query = `${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc&limit=${limit}`;
            
            if (search) {
                query += `&or=(name.ilike.*${search}*,email.ilike.*${search}*)`;
            }

            const response = await fetch(query, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const users = await response.json();
            
            return new Response(JSON.stringify({ data: users }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path === '/admin-api/analytics/dashboard' && method === 'GET') {
            // Get admin dashboard analytics
            const dateRange = url.searchParams.get('range') || '7d';
            
            // Calculate date threshold
            const daysBack = dateRange === '30d' ? 30 : dateRange === '7d' ? 7 : 1;
            const threshold = new Date();
            threshold.setDate(threshold.getDate() - daysBack);
            const thresholdIso = threshold.toISOString();

            // Fetch various metrics
            const [societiesResponse, postsResponse, usersResponse, reportsResponse] = await Promise.all([
                fetch(`${supabaseUrl}/rest/v1/societies?select=id&created_at=gte.${thresholdIso}`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                }),
                fetch(`${supabaseUrl}/rest/v1/posts?select=id&created_at=gte.${thresholdIso}`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                }),
                fetch(`${supabaseUrl}/rest/v1/profiles?select=id&created_at=gte.${thresholdIso}`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                }),
                fetch(`${supabaseUrl}/rest/v1/reports?select=id&status=eq.pending`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                })
            ]);

            const [societies, posts, users, reports] = await Promise.all([
                societiesResponse.json(),
                postsResponse.json(),
                usersResponse.json(),
                reportsResponse.json()
            ]);

            const analytics = {
                new_societies: societies.length,
                new_posts: posts.length,
                new_users: users.length,
                pending_reports: reports.length,
                date_range: dateRange
            };

            return new Response(JSON.stringify({ data: analytics }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Admin API error:', error);

        const errorResponse = {
            error: {
                code: 'ADMIN_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});