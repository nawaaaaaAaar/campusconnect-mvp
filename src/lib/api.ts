import { supabase } from './supabase'

// API Service for CampusConnect Backend
class CampusConnectAPI {
  private baseUrl = `${(import.meta.env.VITE_SUPABASE_URL as string) || 'http://localhost:54321'}/functions/v1`
  
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'API request failed')
    }
    
    return result
  }
  
  // Societies API
  async getSocieties(params?: {
    limit?: number
    cursor?: string
    institute?: string
    category?: string
    verified?: boolean
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/societies-api${query ? `?${query}` : ''}`)
  }
  
  async getSociety(id: string) {
    return this.makeRequest(`/societies-api/${id}`)
  }
  
  async getSocietyMembers(societyId: string, params?: {
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/societies-api/${societyId}/members${query ? `?${query}` : ''}`)
  }
  
  async followSociety(id: string) {
    return this.makeRequest(`/societies-api/${id}/follow`, {
      method: 'POST',
    })
  }
  
  async unfollowSociety(id: string) {
    return this.makeRequest(`/societies-api/${id}/follow`, {
      method: 'DELETE',
    })
  }
  
  // Posts API
  async createPost(postData: {
    society_id: string
    type: string
    text?: string
    media_url?: string
    link_url?: string
  }) {
    return this.makeRequest('/posts-api', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }
  
  async editPost(id: string, postData: {
    text?: string
    media_url?: string
    link_url?: string
  }) {
    return this.makeRequest(`/posts-api/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  }
  
  async getPost(id: string) {
    return this.makeRequest(`/posts-api/${id}`)
  }
  
  async likePost(id: string) {
    return this.makeRequest(`/posts-api/${id}/like`, {
      method: 'POST',
    })
  }
  
  async unlikePost(id: string) {
    return this.makeRequest(`/posts-api/${id}/like`, {
      method: 'DELETE',
    })
  }
  
  async addComment(postId: string, text: string) {
    return this.makeRequest(`/posts-api/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }
  
  async getComments(postId: string, params?: {
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/posts-api/${postId}/comments${query ? `?${query}` : ''}`)
  }

  async deletePost(id: string) {
    return this.makeRequest(`/posts-api/${id}`, {
      method: 'DELETE',
    })
  }

  async deleteComment(postId: string, commentId: string) {
    return this.makeRequest(`/posts-api/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  async adminDeleteComment(commentId: string, reason: string) {
    return this.makeRequest(`/admin-api/comments/${commentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    })
  }
  
  // Home Feed API - The Critical 2F:1G Algorithm
  async getHomeFeed(params?: {
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/home-feed-api${query ? `?${query}` : ''}`)
  }
  
  // Profile API - Fixed endpoint name
  async getProfile() {
    return this.makeRequest('/profile-management')
  }
  
  async updateProfile(profileData: {
    name?: string
    avatar_url?: string
    institute?: string
    course?: string
  }) {
    return this.makeRequest('/profile-management', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }
  
  async getFollowingSocieties(params?: {
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/profile-management/following${query ? `?${query}` : ''}`)
  }

  // Media Upload API
  async uploadMedia(mediaData: string, fileName: string, mediaType: string) {
    return this.makeRequest('/media-upload-api', {
      method: 'POST',
      body: JSON.stringify({
        mediaData,
        fileName,
        mediaType
      }),
    })
  }

  // Notifications API
  async getNotifications(params?: {
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/notifications-api${query ? `?${query}` : ''}`)
  }

  async getNotificationPreferences() {
    return this.makeRequest('/notifications-api/preferences')
  }

  async updateNotificationPreferences(preferences: any) {
    return this.makeRequest('/notifications-api/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    })
  }

  async getUnreadNotificationsCount() {
    return this.makeRequest('/notifications-api/unread-count')
  }

  async registerDeviceToken(deviceToken: string, deviceType = 'web') {
    return this.makeRequest('/notifications-api/device-token', {
      method: 'POST',
      body: JSON.stringify({ deviceToken, deviceType })
    })
  }

  // Invitations API
  async sendSocietyInvitation(societyId: string, email: string, role = 'member') {
    return this.makeRequest(`/invitations-api/societies/${societyId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    })
  }

  async getReceivedInvitations() {
    return this.makeRequest('/invitations-api/received')
  }

  async getSocietyInvitations(societyId: string) {
    return this.makeRequest(`/invitations-api/societies/${societyId}`)
  }

  async respondToInvitation(invitationId: string, action: 'accept' | 'reject') {
    return this.makeRequest(`/invitations-api/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action })
    })
  }

  // Admin API
  async getVerificationRequests() {
    return this.makeRequest('/admin-api/societies/verification-requests')
  }

  async verifySociety(societyId: string, approved: boolean, reason?: string) {
    return this.makeRequest(`/admin-api/societies/${societyId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approved, reason })
    })
  }

  async getReports(status = 'pending') {
    const params = new URLSearchParams({ status })
    return this.makeRequest(`/admin-api/reports?${params}`)
  }

  async resolveReport(reportId: string, action: string, reason: string) {
    return this.makeRequest(`/admin-api/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, reason })
    })
  }

  async getUsers(params?: { limit?: number; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.makeRequest(`/admin-api/users${query ? `?${query}` : ''}`)
  }

  async getAdminAnalytics(range = '7d') {
    return this.makeRequest(`/admin-api/analytics/dashboard?range=${range}`)
  }

  // PRD 3.3: Categories API
  async getCategories() {
    return this.makeRequest('/categories-api')
  }

  // PRD 3.3: Institutes API
  async getInstitutes(params?: {
    limit?: number
    cursor?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.makeRequest(`/institutes-api${query ? `?${query}` : ''}`)
  }

  // PRD 5.8: Reports API
  async createReport(reportData: {
    target_type: 'post' | 'comment' | 'society' | 'user'
    target_id: string
    reason: string
    description?: string
  }) {
    return this.makeRequest('/reports-api', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
  }
}

export const campusAPI = new CampusConnectAPI()

// Type Definitions
export interface Society {
  id: string
  name: string
  institute_id: string
  category?: string
  description?: string
  contact_email?: string
  website?: string
  verified: boolean
  verification_date?: string
  owner_user_id: string
  is_following?: boolean
  society_followers?: { count: number }[]
  society_members?: { count: number }[]
  posts?: { count: number }[]
}

export interface Post {
  id: string
  society_id: string
  author_id: string
  type: string
  text?: string
  media_url?: string
  link_url?: string
  created_at: string
  has_liked?: boolean
  likes_count?: number
  comments_count?: number
  feed_source?: 'followed' | 'global'
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  text: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  name?: string
  avatar_url?: string
  institute?: string
  course?: string
  created_at: string
  society_memberships?: any[]
  society_follows?: any[]
  stats?: {
    societies_member_of: number
    societies_following: number
  }
}

export interface HomeFeedResponse {
  data: Post[]
  cursor?: string
  meta: {
    total_returned: number
    followed_posts: number
    global_posts: number
    followed_societies_count: number
    ratio_achieved?: {
      followed: number
      global: number
    }
  }
  feed_nudge?: {
    type: string
    title: string
    message: string
    action: string
  }
}

export interface NotificationPreferences {
  post_likes: boolean
  post_comments: boolean
  new_followers: boolean
  society_invites: boolean
  society_posts: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  enabled: boolean
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  actor_id?: string
  target_type?: string
  target_id?: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface SocietyInvitation {
  id: string
  society_id: string
  email: string
  invited_by: string
  role: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  responded_at?: string
  expires_at: string
  societies?: {
    id: string
    name: string
  }
}