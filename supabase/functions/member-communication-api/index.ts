import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface MessageData {
  message_type?: 'message' | 'announcement' | 'feedback'
  subject?: string
  content: string
  is_urgent?: boolean
  parent_message_id?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const societyId = pathSegments[2] // /member-communication-api/societies/{societyId}/...
    
    if (!societyId) {
      throw new Error('Society ID is required')
    }

    // Check if user is a member of the society
    const { data: memberData, error: memberError } = await supabase
      .from('society_members')
      .select('*')
      .eq('society_id', societyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !memberData) {
      throw new Error('Only society members can access this feature')
    }

    // Handle different endpoints
    if (req.method === 'GET' && pathSegments.length === 4) {
      // GET /societies/{societyId}/messages - Get messages
      const messages = await getMessages(supabase, societyId)
      return new Response(
        JSON.stringify({ data: messages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && pathSegments.includes('unread-count')) {
      // GET /societies/{societyId}/messages/unread-count
      const unreadCount = await getUnreadCount(supabase, societyId)
      return new Response(
        JSON.stringify({ data: unreadCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && pathSegments.includes('member-status')) {
      // GET /societies/{societyId}/member-status
      return new Response(
        JSON.stringify({ 
          data: {
            isMember: true,
            role: memberData.role,
            joined_at: memberData.joined_at
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && pathSegments.length === 5 && pathSegments[4] === 'messages') {
      // POST /societies/{societyId}/messages - Send message
      const messageData: MessageData = await req.json()
      
      if (!messageData.content?.trim()) {
        throw new Error('Message content is required')
      }

      const message = await sendMessage(supabase, societyId, user.id, messageData)
      return new Response(
        JSON.stringify({ data: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && pathSegments.includes('read-all')) {
      // POST /societies/{societyId}/messages/read-all - Mark all as read
      await markAllAsRead(supabase, societyId)
      return new Response(
        JSON.stringify({ data: { success: true } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && pathSegments.includes('messages') && pathSegments.includes('read')) {
      // POST /messages/{messageId}/read - Mark single message as read
      const messageId = pathSegments[3]
      await markMessageAsRead(supabase, messageId)
      return new Response(
        JSON.stringify({ data: { success: true } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Endpoint not found')

  } catch (error) {
    console.error('Member communication API error:', error)
    const errorResponse = {
      error: {
        code: 'MEMBER_COMMUNICATION_ERROR',
        message: error.message || 'Internal server error'
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: error.message === 'Unauthorized' ? 401 : 
             error.message === 'Only society members can access this feature' ? 403 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getMessages(supabase: any, societyId: string) {
  const { data, error } = await supabase
    .from('member_society_messages')
    .select(`
      *,
      sender_profile:profiles!sender_user_id(
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

async function getUnreadCount(supabase: any, societyId: string) {
  const { count, error } = await supabase
    .from('member_society_messages')
    .select('*', { count: 'exact', head: true })
    .eq('society_id', societyId)
    .eq('is_read', false)

  if (error) throw error
  return count || 0
}

async function sendMessage(supabase: any, societyId: string, senderUserId: string, messageData: MessageData) {
  const { data, error } = await supabase
    .from('member_society_messages')
    .insert({
      society_id: societyId,
      sender_user_id: senderUserId,
      message_type: messageData.message_type || 'message',
      subject: messageData.subject?.trim() || null,
      content: messageData.content.trim(),
      is_urgent: messageData.is_urgent || false,
      parent_message_id: messageData.parent_message_id || null
    })
    .select(`
      *,
      sender_profile:profiles!sender_user_id(
        id,
        name,
        email,
        avatar_url
      )
    `)
    .single()

  if (error) throw error
  return data
}

async function markMessageAsRead(supabase: any, messageId: string) {
  const { error } = await supabase
    .from('member_society_messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) throw error
}

async function markAllAsRead(supabase: any, societyId: string) {
  const { error } = await supabase
    .from('member_society_messages')
    .update({ is_read: true })
    .eq('society_id', societyId)
    .eq('is_read', false)

  if (error) throw error
}
