import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface NotificationPreferences {
  post_likes: boolean
  post_comments: boolean
  new_followers: boolean
  society_invites: boolean
  society_posts: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  enabled: boolean
}

interface Notification {
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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
    loadNotifications()
    loadUnreadCount()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('notifications-api', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error
      
      if (data?.data) {
        setPreferences(data.data)
      }
    } catch (err: any) {
      console.error('Failed to load notification preferences:', err)
      // Set default preferences
      setPreferences({
        post_likes: true,
        post_comments: true,
        new_followers: true,
        society_invites: true,
        society_posts: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
        enabled: true
      })
    }
  }

  const updatePreferences = async (prefs: NotificationPreferences) => {
    try {
      const response = await fetch(`https://egdavxjkyxvawgguqmvx.supabase.co/functions/v1/notifications-api/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(prefs)
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const result = await response.json()
      setPreferences(result.data)
    } catch (err: any) {
      console.error('Failed to update notification preferences:', err)
      throw err
    }
  }

  const loadNotifications = useCallback(async (isRefresh = false, loadMore = false) => {
    const currentCursor = loadMore ? cursor : null
    
    if (loadMore) {
      // Loading more handled separately
    } else if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '20'
      })
      
      if (currentCursor) {
        params.append('cursor', currentCursor)
      }

      const response = await fetch(`https://egdavxjkyxvawgguqmvx.supabase.co/functions/v1/notifications-api?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const result = await response.json()
      
      if (loadMore) {
        setNotifications(prev => [...prev, ...result.data])
      } else {
        setNotifications(result.data)
      }
      
      setCursor(result.cursor)
      setHasMore(!!result.cursor)
      
      // Update unread count after loading
      loadUnreadCount()
      
    } catch (err: any) {
      console.error('Failed to load notifications:', err)
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [cursor])

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`https://egdavxjkyxvawgguqmvx.supabase.co/functions/v1/notifications-api/unread-count`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setUnreadCount(result.data.unread_count)
      }
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }

  const refreshNotifications = useCallback(() => {
    setCursor(null)
    setHasMore(true)
    loadNotifications(true, false)
  }, [loadNotifications])

  const loadMoreNotifications = useCallback(() => {
    if (hasMore) {
      return loadNotifications(false, true)
    }
  }, [loadNotifications, hasMore])

  const registerDeviceToken = async (token: string, deviceType = 'web') => {
    try {
      const { data, error } = await supabase.functions.invoke('notifications-api', {
        body: {
          deviceToken: token,
          deviceType
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error
      
      return data
    } catch (err: any) {
      console.error('Failed to register device token:', err)
      throw err
    }
  }

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    refreshing,
    hasMore,
    error,
    updatePreferences,
    refreshNotifications,
    loadMoreNotifications,
    registerDeviceToken,
    loadUnreadCount
  }
}