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
      // Get user profile by id (not user_id)
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(`Failed to fetch profile: ${errorText}`);
      }

      const profiles = await profileResponse.json();
      const profile = profiles.length > 0 ? profiles[0] : null;

      // If no profile exists, return null (not an error)
      return new Response(JSON.stringify({ data: profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Create or update user profile with support for both students and societies
      const requestData = await req.json();
      const { name, avatar_url, institute, course, account_type, bio } = requestData;

      // Validate account_type
      if (account_type && !['student', 'society'].includes(account_type)) {
        throw new Error('Invalid account_type. Must be either "student" or "society"');
      }

      const profileData = {
        id: userId,
        user_id: userId,
        name,
        avatar_url,
        institute,
        course: course || null,
        account_type: account_type || 'student'
      };

      console.log(`Attempting to upsert profile for user ${userId} with email ${user.email}`);

      let response;
      let savedProfile;

      try {
        // First, try to update the existing profile by email
        console.log('Attempting to update existing profile...');
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(user.email)}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            ...profileData,
            updated_at: new Date().toISOString()
          })
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('Update response:', updateResult);
          
          if (Array.isArray(updateResult) && updateResult.length > 0) {
            // Update successful - profile existed and was updated
            savedProfile = updateResult[0];
            console.log('Profile updated successfully:', savedProfile.id);
          } else {
            // No existing profile found, need to create new one
            console.log('No existing profile found, creating new profile...');
            
            const createResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                'apikey': supabaseServiceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({
                ...profileData,
                email: user.email,
                created_at: new Date().toISOString()
              })
            });

            if (!createResponse.ok) {
              const createError = await createResponse.text();
              console.error('Profile creation failed:', createError);
              
              // If it's a constraint violation, try one more update attempt
              if (createError.includes('duplicate key') || createError.includes('23505')) {
                console.log('Constraint violation detected, retrying update...');
                const retryResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(user.email)}`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                    'apikey': supabaseServiceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify({
                    ...profileData,
                    updated_at: new Date().toISOString()
                  })
                });
                
                if (retryResponse.ok) {
                  const retryResult = await retryResponse.json();
                  if (Array.isArray(retryResult) && retryResult.length > 0) {
                    savedProfile = retryResult[0];
                    console.log('Retry update successful:', savedProfile.id);
                  } else {
                    throw new Error('Profile exists but could not be updated');
                  }
                } else {
                  const retryError = await retryResponse.text();
                  throw new Error(`Failed to update existing profile: ${retryError}`);
                }
              } else {
                throw new Error(`Failed to create profile: ${createError}`);
              }
            } else {
              const createResult = await createResponse.json();
              savedProfile = Array.isArray(createResult) ? createResult[0] : createResult;
              console.log('Profile created successfully:', savedProfile.id);
            }
          }
        } else {
          const updateError = await updateResponse.text();
          console.error('Update request failed:', updateError);
          throw new Error(`Failed to update profile: ${updateError}`);
        }
      } catch (error) {
        console.error('Profile operation error:', error);
        throw error;
      }

      // If this is a society profile, handle society creation separately
      if (profileData.account_type === 'society') {
        const { society_name, society_category, society_description } = requestData;
        
        if (society_name) {
          // Check if society already exists for this user
          const existingSocietyResponse = await fetch(`${supabaseUrl}/rest/v1/societies?owner_user_id=eq.${userId}`, {
            headers: {
              'Authorization': `Bearer ${supabaseServiceRoleKey}`,
              'apikey': supabaseServiceRoleKey,
              'Content-Type': 'application/json'
            }
          });
          
          const existingSocieties = await existingSocietyResponse.json();
          
          if (!Array.isArray(existingSocieties) || existingSocieties.length === 0) {
            // Find or create institute
            let instituteId;
            if (institute) {
              const instituteResponse = await fetch(`${supabaseUrl}/rest/v1/institutes?name=eq.${encodeURIComponent(institute)}`, {
                headers: {
                  'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                  'apikey': supabaseServiceRoleKey,
                  'Content-Type': 'application/json'
                }
              });
              
              const institutes = await instituteResponse.json();
              if (Array.isArray(institutes) && institutes.length > 0) {
                instituteId = institutes[0].id;
              } else {
                // Create new institute
                const createInstituteResponse = await fetch(`${supabaseUrl}/rest/v1/institutes`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                    'apikey': supabaseServiceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify({ name: institute })
                });
                
                if (createInstituteResponse.ok) {
                  const newInstitute = await createInstituteResponse.json();
                  instituteId = Array.isArray(newInstitute) ? newInstitute[0].id : newInstitute.id;
                }
              }
            }
            
            // Create society if we have an institute
            if (instituteId) {
              const societyData = {
                name: society_name,
                institute_id: instituteId,
                category: society_category || null,
                owner_user_id: userId,
                verified: false
              };
              
              const societyResponse = await fetch(`${supabaseUrl}/rest/v1/societies`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                  'apikey': supabaseServiceRoleKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(societyData)
              });
              
              if (!societyResponse.ok) {
                const societyError = await societyResponse.text();
                console.error('Society creation failed:', societyError);
                // Don't throw error - profile creation succeeded, society creation is secondary
              } else {
                console.log('Society created successfully for user:', userId);
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ data: savedProfile }), {
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
