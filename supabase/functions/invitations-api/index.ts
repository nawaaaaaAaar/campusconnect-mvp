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
    const userEmail = userData.email;

    try {
        if (path.match(/\/invitations-api\/societies\/([a-f0-9-]+)\/invite$/) && method === 'POST') {
            // Send society invitation
            const societyId = path.split('/')[3];
            const { email, role = 'member' } = await req.json();

            if (!email) {
                throw new Error('Email is required');
            }

            // Validate that user is owner or admin of the society
            const societyResponse = await fetch(`${supabaseUrl}/rest/v1/societies?id=eq.${societyId}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const societies = await societyResponse.json();
            const society = societies[0];

            if (!society) {
                throw new Error('Society not found');
            }

            // Check if user is owner (for now, only owners can invite)
            if (society.owner_user_id !== userId) {
                throw new Error('Only society owners can send invitations');
            }

            // Check if user is already a member
            const memberResponse = await fetch(`${supabaseUrl}/rest/v1/society_members?society_id=eq.${societyId}&user_id=eq.${userId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const existingMembers = await memberResponse.json();
            if (existingMembers.length > 0) {
                throw new Error('User is already a member of this society');
            }

            // Check if invitation already exists
            const inviteResponse = await fetch(`${supabaseUrl}/rest/v1/society_invitations?society_id=eq.${societyId}&email=eq.${email}&status=eq.pending`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const existingInvites = await inviteResponse.json();
            if (existingInvites.length > 0) {
                throw new Error('Invitation already sent to this email');
            }

            // Create invitation
            const invitationData = {
                society_id: societyId,
                email: email,
                invited_by: userId,
                role: role,
                status: 'pending',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            };

            const createResponse = await fetch(`${supabaseUrl}/rest/v1/society_invitations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(invitationData)
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Failed to create invitation: ${errorText}`);
            }

            const invitation = await createResponse.json();

            // TODO: Send email notification (would require email service integration)
            // For now, we'll create a notification record
            const notificationData = {
                user_id: userId, // The inviter gets a notification that invite was sent
                type: 'invitation_sent',
                title: 'Invitation Sent',
                message: `Invitation sent to ${email} to join ${society.name}`,
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/notifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });

            return new Response(JSON.stringify({ data: invitation[0] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path === '/invitations-api/received' && method === 'GET') {
            // Get invitations received by current user
            const response = await fetch(`${supabaseUrl}/rest/v1/society_invitations?email=eq.${userEmail}&select=*,societies(name,id)&order=created_at.desc`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const invitations = await response.json();
            
            return new Response(JSON.stringify({ data: invitations }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path.match(/\/invitations-api\/([a-f0-9-]+)\/respond$/) && method === 'POST') {
            // Respond to invitation (accept/reject)
            const invitationId = path.split('/')[2];
            const { action } = await req.json(); // 'accept' or 'reject'

            if (!['accept', 'reject'].includes(action)) {
                throw new Error('Action must be "accept" or "reject"');
            }

            // Get invitation
            const inviteResponse = await fetch(`${supabaseUrl}/rest/v1/society_invitations?id=eq.${invitationId}&email=eq.${userEmail}&select=*,societies(name,id)`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const invitations = await inviteResponse.json();
            const invitation = invitations[0];

            if (!invitation) {
                throw new Error('Invitation not found or not authorized');
            }

            if (invitation.status !== 'pending') {
                throw new Error('Invitation has already been responded to');
            }

            // Check if invitation has expired
            if (new Date(invitation.expires_at) < new Date()) {
                throw new Error('Invitation has expired');
            }

            // Update invitation status
            const updateData = {
                status: action === 'accept' ? 'accepted' : 'rejected',
                responded_at: new Date().toISOString()
            };

            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/society_invitations?id=eq.${invitationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update invitation: ${errorText}`);
            }

            // If accepted, add user as society member
            if (action === 'accept') {
                const memberData = {
                    society_id: invitation.society_id,
                    user_id: userId,
                    role: invitation.role,
                    joined_at: new Date().toISOString()
                };

                const memberResponse = await fetch(`${supabaseUrl}/rest/v1/society_members`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(memberData)
                });

                if (!memberResponse.ok) {
                    const errorText = await memberResponse.text();
                    console.error('Failed to add member:', errorText);
                    // Don't throw error here, invitation was still processed
                }
            }

            // Create notification for inviter
            const notificationData = {
                user_id: invitation.invited_by,
                type: 'invitation_response',
                title: `Invitation ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
                message: `${userEmail} has ${action === 'accept' ? 'accepted' : 'rejected'} the invitation to join ${invitation.societies?.name || 'the society'}`,
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/notifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });

            return new Response(JSON.stringify({ data: { success: true, action } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (path.match(/\/invitations-api\/societies\/([a-f0-9-]+)$/) && method === 'GET') {
            // Get invitations sent by society
            const societyId = path.split('/')[3];
            
            // Verify user has permission to view society invitations
            const societyResponse = await fetch(`${supabaseUrl}/rest/v1/societies?id=eq.${societyId}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const societies = await societyResponse.json();
            const society = societies[0];

            if (!society || society.owner_user_id !== userId) {
                throw new Error('Not authorized to view invitations for this society');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/society_invitations?society_id=eq.${societyId}&select=*&order=created_at.desc`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const invitations = await response.json();
            
            return new Response(JSON.stringify({ data: invitations }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Invitations API error:', error);

        const errorResponse = {
            error: {
                code: 'INVITATIONS_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});