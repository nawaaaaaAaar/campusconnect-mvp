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

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        const url = new URL(req.url);
        const method = req.method;
        const pathSegments = url.pathname.split('/').filter(Boolean).slice(1); // Remove 'societies-api'
        
        // Get user from auth header (optional for some endpoints)
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                userId = userData.id;
            }
        }

        // GET /societies - List all societies with pagination
        if (method === 'GET' && pathSegments.length === 0) {
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const cursor = url.searchParams.get('cursor');
            const institute = url.searchParams.get('institute');
            const category = url.searchParams.get('category');
            const verified = url.searchParams.get('verified');
            const search = url.searchParams.get('search');
            
            // Select only core columns that definitely exist
            let query = `${supabaseUrl}/rest/v1/societies?select=id,name,category,owner_user_id,institute_id,created_at,updated_at`;
            
            // Add filters
            const filters = [];
            if (institute) filters.push(`institute_id.eq.${institute}`);
            if (category) filters.push(`category.eq.${category}`);
            if (verified !== null && verified !== undefined) filters.push(`verified.eq.${verified}`);
            if (search) filters.push(`name.ilike.*${search}*`);
            if (cursor) filters.push(`created_at.lt.${cursor}`);
            
            if (filters.length > 0) {
                query += `&${filters.join('&')}`;
            }
            
            query += `&limit=${limit}&order=name.asc`;
            
            const response = await fetch(query, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Societies fetch error:', errorText);
                throw new Error(`Failed to fetch societies: ${errorText}`);
            }
            
            const societies = await response.json();
            
            return new Response(JSON.stringify({
                data: societies,
                cursor: societies.length === limit ? societies[societies.length - 1].name : null
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /societies/{id} - Get society details
        if (method === 'GET' && pathSegments.length === 1) {
            const societyId = pathSegments[0];
            
            const response = await fetch(
                `${supabaseUrl}/rest/v1/societies?select=*&id=eq.${societyId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch society: ${errorText}`);
            }
            
            const societies = await response.json();
            
            if (societies.length === 0) {
                return new Response(JSON.stringify({
                    error: { code: 'SOCIETY_NOT_FOUND', message: 'Society not found' }
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Check if user follows this society
            let isFollowing = false;
            if (userId) {
                const followResponse = await fetch(
                    `${supabaseUrl}/rest/v1/society_followers?user_id=eq.${userId}&society_id=eq.${societyId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                
                if (followResponse.ok) {
                    const follows = await followResponse.json();
                    isFollowing = follows.length > 0;
                }
            }
            
            const society = societies[0];
            society.is_following = isFollowing;
            
            return new Response(JSON.stringify({ data: society }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /societies/{id}/members - Get society members (public)
        if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'members') {
            const societyId = pathSegments[0];
            
            const response = await fetch(
                `${supabaseUrl}/rest/v1/society_members?select=*,profiles!inner(name,avatar_url)&society_id=eq.${societyId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch society members: ${errorText}`);
            }
            
            const members = await response.json();
            
            return new Response(JSON.stringify({ data: members }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // POST /societies/{id}/follow - Follow a society
        if (method === 'POST' && pathSegments.length === 2 && pathSegments[1] === 'follow') {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const societyId = pathSegments[0];
            
            // Check if already following (idempotent operation)
            const existingFollow = await fetch(
                `${supabaseUrl}/rest/v1/society_followers?user_id=eq.${userId}&society_id=eq.${societyId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (existingFollow.ok) {
                const follows = await existingFollow.json();
                if (follows.length > 0) {
                    // Already following - return success (idempotent)
                    return new Response(JSON.stringify({
                        data: { success: true, already_following: true }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Create follow relationship
            const followResponse = await fetch(
                `${supabaseUrl}/rest/v1/society_followers`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        society_id: societyId,
                        created_at: new Date().toISOString()
                    })
                }
            );
            
            if (!followResponse.ok) {
                const errorText = await followResponse.text();
                throw new Error(`Failed to follow society: ${errorText}`);
            }
            
            return new Response(JSON.stringify({
                data: { success: true, already_following: false }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // DELETE /societies/{id}/follow - Unfollow a society  
        if (method === 'DELETE' && pathSegments.length === 2 && pathSegments[1] === 'follow') {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const societyId = pathSegments[0];
            
            // Delete follow relationship (idempotent)
            await fetch(
                `${supabaseUrl}/rest/v1/society_followers?user_id=eq.${userId}&society_id=eq.${societyId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            // Always return success for unfollow (idempotent)
            return new Response(JSON.stringify({
                data: { success: true }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Route not found
        return new Response(JSON.stringify({
            error: { code: 'ROUTE_NOT_FOUND', message: 'API route not found' }
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Societies API error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'SOCIETIES_API_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});