import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Bell, BellOff, Moon, Smartphone, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { notificationService } from '../lib/notifications'
import { toast } from 'sonner'

interface NotificationPreferences {
  push_enabled: boolean
  email_enabled: boolean
  post_likes: boolean
  post_comments: boolean
  society_updates: boolean
  invitations: boolean
  quiet_hours_enabled: boolean
  quiet_start: string
  quiet_end: string
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: true,
    post_likes: true,
    post_comments: true,
    society_updates: true,
    invitations: true,
    quiet_hours_enabled: true,
    quiet_start: '22:00',
    quiet_end: '07:00'
  })
  
  const [fcmSettings, setFcmSettings] = useState({
    isSupported: false,
    permission: 'default' as NotificationPermission,
    hasToken: false,
    isQuietHours: false
  })
  
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const loadPreferences = useCallback(async () => {
    try {
      const response = await campusAPI.getNotificationPreferences()
      if (response.data) {
        setPreferences({ ...preferences, ...response.data })
      }
    } catch (error: any) {
      console.error('Failed to load notification preferences:', error)
    }
  }, [preferences])

  const updateFCMSettings = () => {
    const settings = notificationService.getSettings()
    setFcmSettings(settings)
  }

  useEffect(() => {
    loadPreferences()
    updateFCMSettings()
  }, [loadPreferences])

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    setLoading(true)
    try {
      const updatedPrefs = { ...preferences, ...newPreferences }
      await campusAPI.updateNotificationPreferences(updatedPrefs)
      setPreferences(updatedPrefs)
      toast.success('Notification preferences updated')
    } catch (error: any) {
      toast.error('Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  const initializePushNotifications = async () => {
    setInitializing(true)
    try {
      const success = await notificationService.initialize()
      if (success) {
        updateFCMSettings()
        await updatePreferences({ push_enabled: true })
        toast.success('Push notifications enabled!')
        
        // Set up foreground handling
        notificationService.setupForegroundHandling((payload) => {
          toast.info(payload.notification?.title || 'New notification', {
            description: payload.notification?.body
          })
        })
      } else {
        toast.error('Failed to enable push notifications')
      }
    } catch (error: any) {
      toast.error('Failed to initialize push notifications')
    } finally {
      setInitializing(false)
    }
  }

  const testNotification = async () => {
    try {
      await notificationService.sendTestNotification()
      toast.success('Test notification sent!')
    } catch (error: any) {
      toast.error('Failed to send test notification')
    }
  }

  const disablePushNotifications = async () => {
    try {
      await notificationService.disable()
      await updatePreferences({ push_enabled: false })
      updateFCMSettings()
      toast.success('Push notifications disabled')
    } catch (error: any) {
      toast.error('Failed to disable push notifications')
    }
  }

  const getPermissionBadge = () => {
    switch (fcmSettings.permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Enabled</Badge>
      case 'denied':
        return <Badge variant="destructive"><BellOff className="h-3 w-3 mr-1" />Blocked</Badge>
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Not Set</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <span>Push Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Browser Support</p>
              <p className="text-sm text-gray-600">
                {fcmSettings.isSupported ? 'Supported in this browser' : 'Not supported in this browser'}
              </p>
            </div>
            <Badge variant={fcmSettings.isSupported ? 'default' : 'secondary'}>
              {fcmSettings.isSupported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Permission Status</p>
              <p className="text-sm text-gray-600">Current browser permission level</p>
            </div>
            {getPermissionBadge()}
          </div>

          {fcmSettings.isSupported && (
            <div className="flex space-x-3">
              {fcmSettings.permission !== 'granted' ? (
                <Button 
                  onClick={initializePushNotifications}
                  disabled={initializing || !fcmSettings.isSupported}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {initializing ? 'Enabling...' : 'Enable Push Notifications'}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={testNotification}
                    variant="outline"
                    size="sm"
                  >
                    Test Notification
                  </Button>
                  <Button 
                    onClick={disablePushNotifications}
                    variant="outline"
                    size="sm"
                  >
                    Disable
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRD Section 5.6: Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Moon className="h-5 w-5 text-purple-600" />
            <span>Quiet Hours (22:00 - 07:00)</span>
            {fcmSettings.isQuietHours && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Clock className="h-3 w-3 mr-1" />Active Now
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Quiet Hours</p>
              <p className="text-sm text-gray-600">
                Suppress non-urgent notifications during sleep hours
              </p>
            </div>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePreferences({ quiet_hours_enabled: checked })}
              disabled={loading}
            />
          </div>
          
          <div className="text-sm text-gray-600 p-3 bg-purple-50 rounded-lg">
            <p className="font-medium mb-1">How it works:</p>
            <p>• Notifications from 22:00 to 07:00 are automatically suppressed</p>
            <p>• Only urgent notifications (like emergency alerts) will be shown</p>
            <p>• All suppressed notifications will be available when you wake up</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Notification Types</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Post Likes</p>
                <p className="text-sm text-gray-600">When someone likes your posts</p>
              </div>
              <Switch
                checked={preferences.post_likes}
                onCheckedChange={(checked) => updatePreferences({ post_likes: checked })}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Comments</p>
                <p className="text-sm text-gray-600">When someone comments on your posts</p>
              </div>
              <Switch
                checked={preferences.post_comments}
                onCheckedChange={(checked) => updatePreferences({ post_comments: checked })}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Society Updates</p>
                <p className="text-sm text-gray-600">New posts from societies you follow</p>
              </div>
              <Switch
                checked={preferences.society_updates}
                onCheckedChange={(checked) => updatePreferences({ society_updates: checked })}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Invitations</p>
                <p className="text-sm text-gray-600">Society membership invitations</p>
              </div>
              <Switch
                checked={preferences.invitations}
                onCheckedChange={(checked) => updatePreferences({ invitations: checked })}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-green-600" />
            <span>Email Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive important notifications via email</p>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}