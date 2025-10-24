import { getCorsHeaders, handleCors } from '../_shared/cors.ts'
import { checkRateLimit, createRateLimitResponse, getRateLimitIdentifier, rateLimitConfigs } from '../_shared/ratelimit.ts'
import { requireAuth } from '../_shared/auth.ts'
import { createErrorResponse, ErrorCode, handleDatabaseError } from '../_shared/errors.ts'
import { validateText, validatePagination } from '../_shared/validation.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return createErrorResponse(
        ErrorCode.CONFIG_ERROR,
        'Supabase configuration missing',
        corsHeaders
      )
    }

    // Authenticate user
    const user = await requireAuth(req, supabaseUrl, serviceRoleKey, corsHeaders)
    const userId = user.id
    
    // Apply rate limiting
    const rateLimitKey = getRateLimitIdentifier(req, userId)
    const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfigs.api)
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, corsHeaders)
    }

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
        
        // Check if user is an admin
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${userId}&is_active=eq.true&select=role`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });
        
        const adminData = adminCheckResponse.ok ? await adminCheckResponse.json() : [];
        const isAdmin = adminData.length > 0;
        
        // Add stats and relationships
        const profileData = {
          ...profile,
          is_admin: isAdmin,
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

        // Validate input
        if (name) {
          const nameValidation = validateText(name, { 
            minLength: 2, 
            maxLength: 100, 
            fieldName: 'Name' 
          })
          if (!nameValidation.valid) {
            return createErrorResponse(
              ErrorCode.VALIDATION_ERROR,
              nameValidation.error || 'Invalid name',
              corsHeaders
            )
          }
        }

        if (institute) {
          const instituteValidation = validateText(institute, { 
            minLength: 2, 
            maxLength: 200, 
            fieldName: 'Institute' 
          })
          if (!instituteValidation.valid) {
            return createErrorResponse(
              ErrorCode.VALIDATION_ERROR,
              instituteValidation.error || 'Invalid institute name',
              corsHeaders
            )
          }
        }

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
