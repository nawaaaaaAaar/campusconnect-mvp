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
        
        // Only handle GET requests
        if (method !== 'GET') {
            return new Response(JSON.stringify({
                error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported' }
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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
        
        if (!userId) {
            return new Response(JSON.stringify({
                error: { code: 'UNAUTHORIZED', message: 'Authentication required for home feed' }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const cursor = url.searchParams.get('cursor');
        
        // Validate limit
        if (limit > 50 || limit < 1) {
            return new Response(JSON.stringify({
                error: { code: 'INVALID_LIMIT', message: 'Limit must be between 1 and 50' }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        console.log(`Generating home feed for user ${userId} with limit ${limit}, cursor: ${cursor}`);
        
        // CRITICAL: 2F:1G Algorithm Implementation
        // 70% followed societies, 30% global posts
        const followedRatio = 0.7;
        const globalRatio = 0.3;
        
        const followedLimit = Math.ceil(limit * followedRatio);
        const globalLimit = Math.ceil(limit * globalRatio);
        
        console.log(`Fetching ${followedLimit} followed posts and ${globalLimit} global posts`);
        
        // Step 1: Get societies the user follows
        const followedSocietiesResponse = await fetch(
            `${supabaseUrl}/rest/v1/society_followers?select=society_id&user_id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        let followedSocietyIds = [];
        if (followedSocietiesResponse.ok) {
            const follows = await followedSocietiesResponse.json();
            followedSocietyIds = follows.map(f => f.society_id);
        }
        
        console.log(`User follows ${followedSocietyIds.length} societies:`, followedSocietyIds);
        
        let followedPosts = [];
        let globalPosts = [];
        
        // Step 2: Fetch posts from followed societies (if any)
        if (followedSocietyIds.length > 0) {
            let followedQuery = `${supabaseUrl}/rest/v1/posts?select=*,post_likes(count),post_comments(count)`;
            followedQuery += `&society_id=in.(${followedSocietyIds.join(',')})`;
            
            if (cursor) {
                // Parse cursor (created_at:id format)
                const [cursorTime, cursorId] = cursor.split(':');
                followedQuery += `&or=(created_at.lt.${cursorTime},and(created_at.eq.${cursorTime},id.lt.${cursorId}))`;
            }
            
            followedQuery += `&limit=${followedLimit * 2}&order=created_at.desc,id.desc`;
            
            console.log('Followed posts query:', followedQuery);
            
            const followedResponse = await fetch(followedQuery, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (followedResponse.ok) {
                followedPosts = await followedResponse.json();
                console.log(`Fetched ${followedPosts.length} posts from followed societies`);
            }
        }
        
        // Step 3: Fetch global posts (from all societies, excluding followed ones for diversity)
        let globalQuery = `${supabaseUrl}/rest/v1/posts?select=*,post_likes(count),post_comments(count)`;
        
        // Exclude followed societies to ensure diversity
        if (followedSocietyIds.length > 0) {
            globalQuery += `&society_id=not.in.(${followedSocietyIds.join(',')})`;
        }
        
        if (cursor) {
            const [cursorTime, cursorId] = cursor.split(':');
            globalQuery += `&or=(created_at.lt.${cursorTime},and(created_at.eq.${cursorTime},id.lt.${cursorId}))`;
        }
        
        globalQuery += `&limit=${globalLimit * 2}&order=created_at.desc,id.desc`;
        
        console.log('Global posts query:', globalQuery);
        
        const globalResponse = await fetch(globalQuery, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (globalResponse.ok) {
            globalPosts = await globalResponse.json();
            console.log(`Fetched ${globalPosts.length} global posts`);
        }
        
        // Step 4: Intelligent 2F:1G Interleaving Algorithm
        const interleavedPosts = [];
        let followedIndex = 0;
        let globalIndex = 0;
        let followedCount = 0;
        let globalCount = 0;
        
        // Interleave posts maintaining 2:1 ratio (followed:global)
        for (let i = 0; i < limit && (followedIndex < followedPosts.length || globalIndex < globalPosts.length); i++) {
            const shouldUseFollowed = (
                followedIndex < followedPosts.length && 
                (globalIndex >= globalPosts.length || 
                 (followedCount < followedLimit && (followedCount + globalCount === 0 || followedCount / (followedCount + globalCount) < followedRatio)))
            );
            
            if (shouldUseFollowed) {
                const post = followedPosts[followedIndex];
                post.feed_source = 'followed';
                interleavedPosts.push(post);
                followedIndex++;
                followedCount++;
            } else if (globalIndex < globalPosts.length) {
                const post = globalPosts[globalIndex];
                post.feed_source = 'global';
                interleavedPosts.push(post);
                globalIndex++;
                globalCount++;
            }
        }
        
        console.log(`Interleaved feed: ${followedCount} followed + ${globalCount} global = ${interleavedPosts.length} total`);
        
        // Step 5: Enhance posts with user interaction data
        const postIds = interleavedPosts.map(p => p.id);
        let userLikes = [];
        
        if (postIds.length > 0) {
            const likesResponse = await fetch(
                `${supabaseUrl}/rest/v1/post_likes?select=post_id&user_id=eq.${userId}&post_id=in.(${postIds.join(',')})`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (likesResponse.ok) {
                userLikes = await likesResponse.json();
            }
        }
        
        const likedPostIds = new Set(userLikes.map(l => l.post_id));
        
        // Add user interaction flags
        interleavedPosts.forEach(post => {
            post.has_liked = likedPostIds.has(post.id);
            post.likes_count = post.post_likes?.[0]?.count || 0;
            post.comments_count = post.post_comments?.[0]?.count || 0;
            delete post.post_likes;
            delete post.post_comments;
        });
        
        // Step 6: Calculate next cursor for pagination
        let nextCursor = null;
        if (interleavedPosts.length === limit) {
            const lastPost = interleavedPosts[interleavedPosts.length - 1];
            nextCursor = `${lastPost.created_at}:${lastPost.id}`;
        }
        
        // Step 7: Handle empty feed with nudges
        let feedNudge = null;
        if (interleavedPosts.length === 0) {
            if (followedSocietyIds.length === 0) {
                feedNudge = {
                    type: 'no_follows',
                    title: 'Discover Campus Societies',
                    message: 'Follow societies to see their posts in your feed. Start by exploring popular societies on your campus.',
                    action: 'explore_societies'
                };
            } else {
                feedNudge = {
                    type: 'no_recent_posts',
                    title: 'No Recent Posts',
                    message: 'The societies you follow haven\'t posted recently. Discover more active societies to keep your feed fresh.',
                    action: 'discover_more'
                };
            }
        }
        
        const response = {
            data: interleavedPosts,
            cursor: nextCursor,
            meta: {
                total_returned: interleavedPosts.length,
                followed_posts: followedCount,
                global_posts: globalCount,
                followed_societies_count: followedSocietyIds.length,
                ratio_achieved: interleavedPosts.length > 0 ? {
                    followed: followedCount / interleavedPosts.length,
                    global: globalCount / interleavedPosts.length
                } : null
            },
            feed_nudge: feedNudge
        };
        
        console.log('Home feed response prepared:', {
            posts: interleavedPosts.length,
            followed: followedCount,
            global: globalCount,
            cursor: nextCursor,
            nudge: feedNudge?.type
        });
        
        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Home Feed API error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'HOME_FEED_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});