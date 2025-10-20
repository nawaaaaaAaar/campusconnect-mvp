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

    // Get environment variables
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
        throw new Error('Supabase configuration missing');
    }

    try {
        const { type, targetUserId, actorUserId, targetId, societyId, title, message, data } = await req.json();

        if (!type || !targetUserId || !title || !message) {
            throw new Error('Missing required fields: type, targetUserId, title, message');
        }

        // Check user notification preferences
        const prefsResponse = await fetch(`${supabaseUrl}/rest/v1/notification_preferences?user_id=eq.${targetUserId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const preferences = await prefsResponse.json();
        const userPrefs = preferences[0] || {
            enabled: true,
            quiet_hours_start: '22:00',
            quiet_hours_end: '07:00'
        };

        // Check if notifications are disabled
        if (!userPrefs.enabled) {
            return new Response(JSON.stringify({ data: { sent: false, reason: 'notifications_disabled' } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // PRD 5.6: Check quiet hours (default 22:00-07:00)
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHour * 100 + currentMinutes; // e.g., 14:30 becomes 1430
        
        const quietStart = parseInt(userPrefs.quiet_hours_start.replace(':', ''));
        const quietEnd = parseInt(userPrefs.quiet_hours_end.replace(':', ''));
        
        let inQuietHours = false;
        if (quietStart > quietEnd) {
            // Quiet hours span midnight (e.g., 22:00 to 07:00)
            inQuietHours = currentTime >= quietStart || currentTime <= quietEnd;
        } else {
            // Quiet hours within same day
            inQuietHours = currentTime >= quietStart && currentTime <= quietEnd;
        }

        if (inQuietHours) {
            // PRD 5.6: Queue notification for later (store with is_sent=false)
            const notificationData = {
                user_id: targetUserId,
                type: type,
                title: title,
                message: message,
                actor_id: actorUserId,
                target_type: targetId ? getTargetTypeFromId(targetId) : null,
                target_id: targetId,
                data: data ? JSON.stringify(data) : null,
                is_read: false,
                is_sent: false, // Queue for later
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

            return new Response(JSON.stringify({ data: { sent: false, reason: 'quiet_hours', queued: true } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // PRD 5.6: Rate limiting - ≤1 notification per society per hour per user
        if (societyId) {
            const canSendResponse = await fetch(
                `${supabaseUrl}/rest/v1/rpc/can_send_notification`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_user_id: targetUserId,
                        p_society_id: societyId
                    })
                }
            );

            const canSend = await canSendResponse.json();
            
            if (!canSend) {
                return new Response(JSON.stringify({ 
                    data: { sent: false, reason: 'rate_limited_per_society' } 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Create notification record
        const notificationData = {
            user_id: targetUserId,
            type: type,
            title: title,
            message: message,
            actor_id: actorUserId,
            target_type: targetId ? getTargetTypeFromId(targetId) : null,
            target_id: targetId,
            data: data ? JSON.stringify(data) : null,
            is_read: false,
            is_sent: true, // Sending now (not during quiet hours)
            created_at: new Date().toISOString()
        };

        const createResponse = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(notificationData)
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create notification: ${errorText}`);
        }

        const notification = await createResponse.json();

        // PRD 5.6: Record that notification was sent for rate limiting
        if (societyId) {
            await fetch(
                `${supabaseUrl}/rest/v1/rpc/record_notification_sent`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_user_id: targetUserId,
                        p_society_id: societyId
                    })
                }
            );
        }

        // Get user's device tokens for push notifications
        const tokensResponse = await fetch(
            `${supabaseUrl}/rest/v1/device_tokens?user_id=eq.${targetUserId}&is_active=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const deviceTokens = await tokensResponse.json();

        let pushNotificationsSent = 0;

        // Send push notifications to all active device tokens
        // Note: In a real implementation, you would use Firebase Admin SDK or similar
        // For now, we'll simulate the push notification sending
        for (const tokenRecord of deviceTokens) {
            try {
                // TODO: Implement actual push notification sending
                // This would typically involve calling Firebase Cloud Messaging API
                // or another push notification service
                console.log(`Would send push notification to device token: ${tokenRecord.device_token}`);
                console.log(`Notification: ${title} - ${message}`);
                pushNotificationsSent++;
            } catch (error) {
                console.error('Failed to send push notification:', error);
            }
        }

        return new Response(JSON.stringify({ 
            data: { 
                sent: true, 
                notification_id: notification[0].id,
                push_notifications_sent: pushNotificationsSent
            } 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Push notifications error:', error);

        const errorResponse = {
            error: {
                code: 'PUSH_NOTIFICATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to determine target type from ID format
function getTargetTypeFromId(targetId: string): string {
    if (!targetId) return 'unknown';
    
    // This is a simple heuristic - in a real app you might have prefixes or check the database
    if (targetId.length === 36 && targetId.includes('-')) {
        // Looks like a UUID, could be post, society, etc.
        return 'post'; // Default assumption
    }
    
    return 'unknown';
}