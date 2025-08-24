import React, { useState, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { Bell, BellOff, Settings, Save, Loader2, Check } from 'lucide-react'
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

export function NotificationSettings() {
  const { preferences, updatePreferences, loading } = useNotifications()
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (preferences && !localPrefs) {
      setLocalPrefs(preferences)
    }
  }, [preferences, localPrefs])

  useEffect(() => {
    if (preferences && localPrefs) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(localPrefs)
      setHasChanges(changed)
    }
  }, [preferences, localPrefs])

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!localPrefs) return
    
    setLocalPrefs({
      ...localPrefs,
      [key]: value
    })
  }

  const handleSave = async () => {
    if (!localPrefs || !hasChanges) return
    
    setSaving(true)
    try {
      await updatePreferences(localPrefs)
      toast.success('Notification preferences updated')
      setHasChanges(false)
    } catch (error: any) {
      toast.error('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (preferences) {
      setLocalPrefs(preferences)
      setHasChanges(false)
    }
  }

  if (loading || !localPrefs) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notification settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {localPrefs.enabled ? (
                <Bell className="h-5 w-5 text-blue-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <Label className="text-base font-medium">
                  Enable Notifications
                </Label>
                <p className="text-sm text-gray-600">
                  Turn all notifications on or off
                </p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enabled}
              onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Individual Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Notification Types</h3>
            
            <div className="space-y-4">
              {/* Post Interactions */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Post Likes</Label>
                  <p className="text-sm text-gray-600">When someone likes your posts</p>
                </div>
                <Switch
                  checked={localPrefs.post_likes}
                  onCheckedChange={(checked) => handlePreferenceChange('post_likes', checked)}
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Post Comments</Label>
                  <p className="text-sm text-gray-600">When someone comments on your posts</p>
                </div>
                <Switch
                  checked={localPrefs.post_comments}
                  onCheckedChange={(checked) => handlePreferenceChange('post_comments', checked)}
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">New Followers</Label>
                  <p className="text-sm text-gray-600">When someone follows your societies</p>
                </div>
                <Switch
                  checked={localPrefs.new_followers}
                  onCheckedChange={(checked) => handlePreferenceChange('new_followers', checked)}
                  disabled={!localPrefs.enabled}
                />
              </div>

              {/* Society Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Society Invitations</Label>
                  <p className="text-sm text-gray-600">When you're invited to join a society</p>
                </div>
                <Switch
                  checked={localPrefs.society_invites}
                  onCheckedChange={(checked) => handlePreferenceChange('society_invites', checked)}
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Society Posts</Label>
                  <p className="text-sm text-gray-600">When societies you follow post new content</p>
                </div>
                <Switch
                  checked={localPrefs.society_posts}
                  onCheckedChange={(checked) => handlePreferenceChange('society_posts', checked)}
                  disabled={!localPrefs.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
            <p className="text-sm text-gray-600">
              Set a time period when you won't receive any notifications. Perfect for sleep or study time.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet_start" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="quiet_start"
                  type="time"
                  value={localPrefs.quiet_hours_start}
                  onChange={(e) => handlePreferenceChange('quiet_hours_start', e.target.value)}
                  disabled={!localPrefs.enabled}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="quiet_end" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="quiet_end"
                  type="time"
                  value={localPrefs.quiet_hours_end}
                  onChange={(e) => handlePreferenceChange('quiet_hours_end', e.target.value)}
                  disabled={!localPrefs.enabled}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Quiet hours are currently set from {localPrefs.quiet_hours_start} to {localPrefs.quiet_hours_end}.
                {localPrefs.quiet_hours_start > localPrefs.quiet_hours_end && 
                  " This spans midnight (overnight quiet hours)."
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset}>
                Reset Changes
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          
          {hasChanges && (
            <div className="flex items-center space-x-2 text-sm text-amber-600">
              <span>You have unsaved changes</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}