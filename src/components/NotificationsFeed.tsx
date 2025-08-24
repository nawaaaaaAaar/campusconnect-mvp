import React, { useState, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Bell, MessageCircle, UserPlus, Heart, Users, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

export function NotificationsFeed() {
  const { notifications, loading, refreshing, hasMore, refreshNotifications, loadMoreNotifications } = useNotifications()
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      await loadMoreNotifications()
    } finally {
      setLoadingMore(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
      case 'post_liked':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'post_comment':
      case 'comment_added':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'new_follower':
      case 'society_followed':
        return <UserPlus className="h-5 w-5 text-green-500" />
      case 'society_invite':
      case 'invitation_received':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'society_post':
      case 'new_post':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'invitation_sent':
      case 'invitation_response':
        return <Users className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'post_like':
      case 'post_liked':
        return 'bg-red-50 border-red-200'
      case 'post_comment':
      case 'comment_added':
        return 'bg-blue-50 border-blue-200'
      case 'new_follower':
      case 'society_followed':
        return 'bg-green-50 border-green-200'
      case 'society_invite':
      case 'invitation_received':
        return 'bg-purple-50 border-purple-200'
      case 'society_post':
      case 'new_post':
        return 'bg-blue-50 border-blue-200'
      case 'invitation_sent':
      case 'invitation_response':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshNotifications}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">
              When someone interacts with your posts or invites you to a society, you'll see notifications here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {hasMore && notifications.length > 0 && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More Notifications'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Individual Notification Card Component
interface NotificationCardProps {
  notification: Notification
}

function NotificationCard({ notification }: NotificationCardProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
      case 'post_liked':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'post_comment':
      case 'comment_added':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'new_follower':
      case 'society_followed':
        return <UserPlus className="h-5 w-5 text-green-500" />
      case 'society_invite':
      case 'invitation_received':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'society_post':
      case 'new_post':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'invitation_sent':
      case 'invitation_response':
        return <Users className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'post_like':
      case 'post_liked':
        return 'bg-red-50 border-red-200'
      case 'post_comment':
      case 'comment_added':
        return 'bg-blue-50 border-blue-200'
      case 'new_follower':
      case 'society_followed':
        return 'bg-green-50 border-green-200'
      case 'society_invite':
      case 'invitation_received':
        return 'bg-purple-50 border-purple-200'
      case 'society_post':
      case 'new_post':
        return 'bg-blue-50 border-blue-200'
      case 'invitation_sent':
      case 'invitation_response':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow border ${
      !notification.is_read ? 'ring-2 ring-blue-100' : ''
    } ${getNotificationColor(notification.type)}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                {!notification.is_read && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    New
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 leading-relaxed">
              {notification.message}
            </p>
            
            {/* Additional data or action buttons could go here */}
            {notification.data && (
              <div className="mt-2 text-xs text-gray-500">
                {/* Could display additional context based on notification type */}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}