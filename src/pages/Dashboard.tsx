import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { LogOut, Home, Users, TrendingUp, Settings, Bell, Plus, User, Shield } from 'lucide-react'
import { HomeFeed } from '../components/HomeFeed'
import { EnhancedSocietiesDiscovery } from '../components/EnhancedSocietiesDiscovery'
import { PostCreationForm } from '../components/PostCreationForm'
import { NotificationsFeed } from '../components/NotificationsFeed'
import { NotificationSettings } from '../components/NotificationSettings'
import { AdminPanel } from '../components/AdminPanel'
import { signOut } from '../lib/supabase'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const { user } = useAuth()
  const { unreadCount, loadUnreadCount } = useNotifications()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [showPostForm, setShowPostForm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isAdmin] = useState(false) // In a real app, this would be determined by user role

  // Load unread count on mount and when tab changes
  useEffect(() => {
    loadUnreadCount()
  }, [])

  // Register service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/auth')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  const handlePostSuccess = () => {
    setShowPostForm(false)
    setActiveTab('home')
    toast.success('Post created successfully!')
  }

  const handleBellClick = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      // Reload count when opening notifications
      setTimeout(loadUnreadCount, 500) // Small delay to allow for read status updates
    }
  }

  // Show post creation form overlay
  if (showPostForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900">CampusConnect</h1>
              </div>
              
              <Button variant="outline" onClick={() => setShowPostForm(false)}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Post Creation Form */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <PostCreationForm 
            onSuccess={handlePostSuccess}
            onCancel={() => setShowPostForm(false)}
          />
        </main>
      </div>
    )
  }

  // Show notifications overlay
  if (showNotifications) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900">CampusConnect</h1>
              </div>
              
              <Button variant="outline" onClick={() => setShowNotifications(false)}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Notifications Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <NotificationsFeed />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">CampusConnect</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Create Post Button */}
              <Button 
                onClick={() => setShowPostForm(true)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>

              {/* Notifications Bell */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={handleBellClick}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
              
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">
                  {user?.user_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}
                </p>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-transparent p-1`}>
              <TabsTrigger 
                value="home" 
                className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home Feed</span>
              </TabsTrigger>
              <TabsTrigger 
                value="societies" 
                className="flex items-center space-x-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Societies</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trending" 
                className="flex items-center space-x-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-600"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex items-center space-x-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="flex items-center space-x-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="home" className="mt-0">
            <div className="mb-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Your Personal Campus Feed
                </h2>
                <p className="text-gray-600 mt-1">
                  Discover what's happening in your followed societies and across campus
                </p>
              </div>
              
              {/* Feature Highlight */}
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Powered by 2F:1G Algorithm</h3>
                      <p className="text-blue-100 text-sm">
                        70% posts from societies you follow, 30% discovery content - perfectly balanced for engagement
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">2F:1G</p>
                      <p className="text-blue-100 text-xs">Smart Feed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <HomeFeed />
          </TabsContent>

          <TabsContent value="societies" className="mt-0">
            <EnhancedSocietiesDiscovery />
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Trending on Campus</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Trending content coming soon!</p>
                  <p className="text-sm text-gray-500">
                    We're working on bringing you the most popular posts and topics across your campus.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Info */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-orange-600" />
                      <span>Profile Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Avatar className="h-16 w-16 mx-auto mb-4">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                          {user?.email ? getInitials(user.email) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{user?.email}</h3>
                      <p className="text-gray-600 mb-4">
                        {user?.user_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Profile management features coming soon!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Notification Settings */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <NotificationSettings />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-0">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}