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
        const pathSegments = url.pathname.split('/').filter(Boolean);
        
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

        // POST /posts - Create a new post
        if (method === 'POST' && pathSegments.length === 0) {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const { society_id, type, text, media_url, link_url } = await req.json();
            
            // Validate required fields
            if (!society_id || !type) {
                return new Response(JSON.stringify({
                    error: { code: 'INVALID_REQUEST', message: 'society_id and type are required' }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Validate post type
            const validTypes = ['text', 'image', 'link', 'event'];
            if (!validTypes.includes(type)) {
                return new Response(JSON.stringify({
                    error: { code: 'INVALID_POST_TYPE', message: 'Invalid post type' }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Check if user is a member of the society
            const memberCheck = await fetch(
                `${supabaseUrl}/rest/v1/society_members?user_id=eq.${userId}&society_id=eq.${society_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (memberCheck.ok) {
                const members = await memberCheck.json();
                if (members.length === 0) {
                    return new Response(JSON.stringify({
                        error: { code: 'FORBIDDEN', message: 'User is not a member of this society' }
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Create the post
            const postResponse = await fetch(
                `${supabaseUrl}/rest/v1/posts`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        society_id,
                        author_id: userId,
                        type,
                        text: text || null,
                        media_url: media_url || null,
                        link_url: link_url || null,
                        created_at: new Date().toISOString()
                    })
                }
            );
            
            if (!postResponse.ok) {
                throw new Error(`Failed to create post: ${postResponse.statusText}`);
            }
            
            const posts = await postResponse.json();
            
            return new Response(JSON.stringify({
                data: posts[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /posts/{id} - Get specific post details
        if (method === 'GET' && pathSegments.length === 1) {
            const postId = pathSegments[0];
            
            // Get post with counts
            const postResponse = await fetch(
                `${supabaseUrl}/rest/v1/posts?select=*,post_likes(count),post_comments(count)&id=eq.${postId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (!postResponse.ok) {
                throw new Error(`Failed to fetch post: ${postResponse.statusText}`);
            }
            
            const posts = await postResponse.json();
            
            if (posts.length === 0) {
                return new Response(JSON.stringify({
                    error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const post = posts[0];
            
            // Check if user liked this post
            let hasLiked = false;
            if (userId) {
                const likeResponse = await fetch(
                    `${supabaseUrl}/rest/v1/post_likes?user_id=eq.${userId}&post_id=eq.${postId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                
                if (likeResponse.ok) {
                    const likes = await likeResponse.json();
                    hasLiked = likes.length > 0;
                }
            }
            
            post.has_liked = hasLiked;
            
            return new Response(JSON.stringify({ data: post }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // POST /posts/{id}/like - Like a post
        if (method === 'POST' && pathSegments.length === 2 && pathSegments[1] === 'like') {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const postId = pathSegments[0];
            
            // Check if already liked (idempotent operation)
            const existingLike = await fetch(
                `${supabaseUrl}/rest/v1/post_likes?user_id=eq.${userId}&post_id=eq.${postId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (existingLike.ok) {
                const likes = await existingLike.json();
                if (likes.length > 0) {
                    // Already liked - return success (idempotent)
                    return new Response(JSON.stringify({
                        data: { success: true, already_liked: true }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Create like
            const likeResponse = await fetch(
                `${supabaseUrl}/rest/v1/post_likes`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        post_id: postId,
                        created_at: new Date().toISOString()
                    })
                }
            );
            
            if (!likeResponse.ok) {
                throw new Error(`Failed to like post: ${likeResponse.statusText}`);
            }
            
            return new Response(JSON.stringify({
                data: { success: true, already_liked: false }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // DELETE /posts/{id}/like - Unlike a post
        if (method === 'DELETE' && pathSegments.length === 2 && pathSegments[1] === 'like') {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const postId = pathSegments[0];
            
            // Delete like (idempotent)
            const unlikeResponse = await fetch(
                `${supabaseUrl}/rest/v1/post_likes?user_id=eq.${userId}&post_id=eq.${postId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            // Always return success for unlike (idempotent)
            return new Response(JSON.stringify({
                data: { success: true }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // POST /posts/{id}/comments - Add comment to post
        if (method === 'POST' && pathSegments.length === 2 && pathSegments[1] === 'comments') {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const postId = pathSegments[0];
            const { text } = await req.json();
            
            if (!text || text.trim().length === 0) {
                return new Response(JSON.stringify({
                    error: { code: 'INVALID_REQUEST', message: 'Comment text is required' }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Create comment
            const commentResponse = await fetch(
                `${supabaseUrl}/rest/v1/post_comments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        post_id: postId,
                        author_id: userId,
                        text: text.trim(),
                        created_at: new Date().toISOString()
                    })
                }
            );
            
            if (!commentResponse.ok) {
                throw new Error(`Failed to create comment: ${commentResponse.statusText}`);
            }
            
            const comments = await commentResponse.json();
            
            return new Response(JSON.stringify({
                data: comments[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /posts/{id}/comments - Get comments for post
        if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'comments') {
            const postId = pathSegments[0];
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const cursor = url.searchParams.get('cursor');
            
            let query = `${supabaseUrl}/rest/v1/post_comments?select=*&post_id=eq.${postId}`;
            
            if (cursor) {
                query += `&created_at.lt.${cursor}`;
            }
            
            query += `&limit=${limit}&order=created_at.desc`;
            
            const response = await fetch(query, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.statusText}`);
            }
            
            const comments = await response.json();
            
            return new Response(JSON.stringify({
                data: comments,
                cursor: comments.length === limit ? comments[comments.length - 1].created_at : null
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
        console.error('Posts API error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'POSTS_API_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});