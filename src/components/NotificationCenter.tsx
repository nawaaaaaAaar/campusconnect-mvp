import React, { useState, useEffect } from 'react'
import { 
  Bell, X, Check, AlertCircle, Info, CheckCheck, 
  MessageSquare, Heart, UserPlus, Users, Calendar,
  Settings, Filter, MoreHorizontal, Trash2, Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'society_invite' | 'mention' | 'system'
  title: string
  message: string
  read: boolean
  created_at: string
  user_id?: string
  post_id?: string
  society_id?: string
  metadata?: Record<string, any>
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationCenter({ isOpen, onClose, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      // Mock notifications (in real app, this would come from your notifications API)
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'like',
          title: 'Post Liked',
          message: 'Your post received a new like from John Doe',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          user_id: 'user-123',
          post_id: 'post-456'
        },
        {
          id: '2',
          type: 'comment',
          title: 'New Comment',
          message: 'Jane Smith commented on your post',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user_id: 'user-789',
          post_id: 'post-456'
        },
        {
          id: '3',
          type: 'follow',
          title: 'New Follower',
          message: 'Mike Johnson started following you',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          user_id: 'user-321'
        },
        {
          id: '4',
          type: 'society_invite',
          title: 'Society Invite',
          message: 'You\'ve been invited to join Tech Society',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          society_id: 'society-tech'
        },
        {
          id: '5',
          type: 'mention',
          title: 'You were mentioned',
          message: 'Sarah Williams mentioned you in a comment',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          user_id: 'user-555',
          post_id: 'post-789'
        }
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )

      // TODO: Update in database
      // await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('id', notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )

      // TODO: Update in database
      // await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('read', false)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      // TODO: Delete from database
      // await supabase
      //   .from('notifications')
      //   .delete()
      //   .eq('id', notificationId)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    onNotificationClick?.(notification)
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500" />
      case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'follow': return <UserPlus className="h-4 w-4 text-green-500" />
      case 'society_invite': return <Users className="h-4 w-4 text-purple-500" />
      case 'mention': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'system': return <Info className="h-4 w-4 text-gray-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || (filter === 'unread' && !notif.read)
  )

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex space-x-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <Bell className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">
                {filter === 'unread' ? 'All caught up!' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
              <Settings className="h-4 w-4" />
              <span>Notification Settings</span>
            </button>
            <span className="text-gray-400">
              CampusConnect
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
