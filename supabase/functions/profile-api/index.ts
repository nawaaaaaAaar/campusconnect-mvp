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
        let pathSegments = url.pathname.split('/').filter(Boolean);
        
        // Remove 'functions', 'v1', and function name from path segments
        // Example: /functions/v1/profile-api/following -> ['following']
        const functionNameIndex = pathSegments.indexOf('profile-api');
        if (functionNameIndex !== -1) {
            pathSegments = pathSegments.slice(functionNameIndex + 1);
        }
        
        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        
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

        // GET /profile - Get current user profile
        if (method === 'GET' && pathSegments.length === 0) {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const profileResponse = await fetch(
                `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (!profileResponse.ok) {
                throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
            }
            
            const profiles = await profileResponse.json();
            
            if (profiles.length === 0) {
                return new Response(JSON.stringify({
                    error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const profile = profiles[0];
            
            // Get user's society memberships and follows
            const [membershipsResponse, followsResponse] = await Promise.all([
                fetch(
                    `${supabaseUrl}/rest/v1/society_members?select=society_id,role&user_id=eq.${userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                ),
                fetch(
                    `${supabaseUrl}/rest/v1/society_followers?select=society_id&user_id=eq.${userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                )
            ]);
            
            let memberships = [];
            let follows = [];
            
            if (membershipsResponse.ok) {
                memberships = await membershipsResponse.json();
            }
            
            if (followsResponse.ok) {
                follows = await followsResponse.json();
            }
            
            profile.society_memberships = memberships;
            profile.society_follows = follows;
            profile.stats = {
                societies_member_of: memberships.length,
                societies_following: follows.length
            };
            
            return new Response(JSON.stringify({ data: profile }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // PUT /profile - Update current user profile
        if (method === 'PUT' && pathSegments.length === 0) {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const updateData = await req.json();
            
            // Validate and sanitize update data
            const allowedFields = ['name', 'avatar_url', 'institute', 'course'];
            const sanitizedData = {};
            
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    sanitizedData[key] = value;
                }
            }
            
            if (Object.keys(sanitizedData).length === 0) {
                return new Response(JSON.stringify({
                    error: { code: 'NO_VALID_FIELDS', message: 'No valid fields to update' }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Check if profile exists, create if not
            const existingProfileResponse = await fetch(
                `${supabaseUrl}/rest/v1/profiles?select=id&id=eq.${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            let profileExists = false;
            if (existingProfileResponse.ok) {
                const profiles = await existingProfileResponse.json();
                profileExists = profiles.length > 0;
            }
            
            let profileResponse;
            
            if (!profileExists) {
                // Create new profile
                const createData = {
                    id: userId,
                    email: '', // Will be updated by trigger
                    ...sanitizedData,
                    created_at: new Date().toISOString()
                };
                
                profileResponse = await fetch(
                    `${supabaseUrl}/rest/v1/profiles`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(createData)
                    }
                );
            } else {
                // Update existing profile
                profileResponse = await fetch(
                    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(sanitizedData)
                    }
                );
            }
            
            if (!profileResponse.ok) {
                throw new Error(`Failed to update profile: ${profileResponse.statusText}`);
            }
            
            const profiles = await profileResponse.json();
            
            return new Response(JSON.stringify({ data: profiles[0] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /profile/following - Get societies user is following
        if (method === 'GET' && pathSegments.length === 1 && pathSegments[0] === 'following') {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const cursor = url.searchParams.get('cursor');
            
            // First get the society IDs the user follows
            const followsResponse = await fetch(
                `${supabaseUrl}/rest/v1/society_followers?select=society_id,created_at&user_id=eq.${userId}&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (!followsResponse.ok) {
                throw new Error(`Failed to fetch follows: ${followsResponse.statusText}`);
            }
            
            const follows = await followsResponse.json();
            
            if (follows.length === 0) {
                return new Response(JSON.stringify({
                    data: [],
                    cursor: null,
                    meta: { total_following: 0 }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Get society details for followed societies
            const societyIds = follows.map(f => f.society_id);
            let societyQuery = `${supabaseUrl}/rest/v1/societies?select=*,society_followers(count),society_members(count)&id=in.(${societyIds.join(',')})`;
            
            if (cursor) {
                societyQuery += `&created_at.lt.${cursor}`;
            }
            
            societyQuery += `&limit=${limit}&order=created_at.desc`;
            
            const societiesResponse = await fetch(societyQuery, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (!societiesResponse.ok) {
                throw new Error(`Failed to fetch societies: ${societiesResponse.statusText}`);
            }
            
            const societies = await societiesResponse.json();
            
            return new Response(JSON.stringify({
                data: societies,
                cursor: societies.length === limit ? societies[societies.length - 1].created_at : null,
                meta: { total_following: follows.length }
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
        console.error('Profile API error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'PROFILE_API_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});