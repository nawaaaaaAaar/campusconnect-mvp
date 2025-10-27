import React, { useState, useEffect } from 'react'
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Camera, Edit3, Save, X, Shield, Bell, Globe, 
  Eye, EyeOff, AlertTriangle, Check, Camera as CameraIcon,
  Users, Building, Calendar, Award
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  name: string
  email: string
  bio?: string
  avatar_url?: string
  phone?: string
  location?: string
  institute?: string
  course?: string
  year?: string
  interests?: string[]
  website?: string
  linkedin?: string
  twitter?: string
  account_type: 'student' | 'society'
  society_name?: string
  society_category?: string
  society_description?: string
  verified: boolean
  created_at: string
}

interface ProfileSettingsProps {
  onClose: () => void
  onSave: (profile: UserProfile) => void
}

export function ProfileSettings({ onClose, onSave }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')

  const commonInterests = [
    'Technology', 'Sports', 'Music', 'Art', 'Literature', 'Science',
    'Business', 'Design', 'Gaming', 'Photography', 'Travel', 'Cooking',
    'Fitness', 'Movies', 'Dance', 'Theater', 'Volunteering', 'Environmental'
  ]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setInterests(data.interests || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading profile:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const updatedProfile = {
        ...profile,
        interests,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', profile.id)

      if (error) throw error

      onSave(updatedProfile)
      onClose()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setShowPasswordChange(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      alert('Password updated successfully')
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Error updating password')
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()])
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const isSociety = profile.account_type === 'society'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', label: 'General', icon: User },
              { id: 'profile', label: 'Profile', icon: Edit3 },
              { id: 'privacy', label: 'Privacy', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              
              {/* Avatar */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                    alt={profile.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{profile.name}</h4>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  <p className="text-xs text-blue-600 capitalize">{profile.account_type} Account</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                {!isSociety && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profile.location || ''}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institute
                      </label>
                      <input
                        type="text"
                        value={profile.institute || ''}
                        onChange={(e) => setProfile({ ...profile, institute: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course
                      </label>
                      <input
                        type="text"
                        value={profile.course || ''}
                        onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {isSociety && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Society Name
                      </label>
                      <input
                        type="text"
                        value={profile.society_name || ''}
                        onChange={(e) => setProfile({ ...profile, society_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={profile.society_category || ''}
                        onChange={(e) => setProfile({ ...profile, society_category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        <option value="Academic">Academic</option>
                        <option value="Sports">Sports</option>
                        <option value="Arts">Arts</option>
                        <option value="Technology">Technology</option>
                        <option value="Social">Social</option>
                        <option value="Professional">Professional</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isSociety ? 'Society Description' : 'Bio'}
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isSociety ? 'Describe your society...' : 'Tell us about yourself...'}
                />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Profile Details</h3>
              
              {/* Interests */}
              {!isSociety && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      placeholder="Add an interest"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addInterest}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-2">Popular interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonInterests
                        .filter(interest => !interests.includes(interest))
                        .slice(0, 10)
                        .map((interest) => (
                          <button
                            key={interest}
                            onClick={() => setInterests([...interests, interest])}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                          >
                            {interest}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={profile.linkedin || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={profile.twitter || ''}
                    onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
              
              {/* Account Verification */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {isSociety ? 'Society Verification' : 'Student Verification'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {profile.verified 
                        ? 'Your account is verified' 
                        : 'Get verified to build trust with other users'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.verified ? 'Verified' : 'Pending'}
                </span>
              </div>

              {/* Password Change */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Change Password</h4>
                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Update Password
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="New password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePasswordChange}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setShowPasswordChange(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              
              {/* Notification Settings */}
              <div className="space-y-4">
                {[
                  { id: 'post_likes', label: 'Post Likes', description: 'When someone likes your posts' },
                  { id: 'post_comments', label: 'Post Comments', description: 'When someone comments on your posts' },
                  { id: 'new_followers', label: 'New Followers', description: 'When someone starts following you' },
                  { id: 'society_invites', label: 'Society Invites', description: 'When you\'re invited to join societies' },
                  { id: 'society_updates', label: 'Society Updates', description: 'Updates from societies you follow' },
                  { id: 'mentions', label: 'Mentions', description: 'When someone mentions you' }
                ].map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{setting.label}</h4>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(profile.updated_at || profile.created_at).toLocaleDateString()}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
