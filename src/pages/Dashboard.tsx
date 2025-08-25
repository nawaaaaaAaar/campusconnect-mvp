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
import { Header } from '../components/Header'
import { BottomNavigation } from '../components/BottomNavigation'
import { HomeFeed } from '../components/HomeFeed'
import { SearchAndDiscovery } from '../components/SearchAndDiscovery'
import { PostCreationForm } from '../components/PostCreationForm'
import { NotificationsFeed } from '../components/NotificationsFeed'
import { NotificationSettings } from '../components/NotificationSettings'
import { AdminPanel } from '../components/AdminPanel'
import { signOut } from '../lib/supabase'
import { notificationService } from '../lib/notifications'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const { user, profile } = useAuth()
  const { unreadCount, loadUnreadCount } = useNotifications()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [showPostForm, setShowPostForm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdmin] = useState(false) // In a real app, this would be determined by user role

  // Initialize FCM notifications on mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await notificationService.initialize()
        console.log('FCM notifications initialized')
      } catch (error) {
        console.error('Failed to initialize notifications:', error)
      }
    }
    
    initNotifications()
  }, [])

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
    setActiveTab('notifications')
    if (!showNotifications) {
      // Reload count when opening notifications
      setTimeout(loadUnreadCount, 500) // Small delay to allow for read status updates
    }
  }

  // Show post creation form overlay
  if (showPostForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header
          onCreatePost={() => setShowPostForm(true)}
          onNotificationClick={handleBellClick}
          onSignOut={handleSignOut}
          unreadCount={unreadCount}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
        />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setShowPostForm(false)}>
              Back to Dashboard
            </Button>
          </div>
          <PostCreationForm 
            onSuccess={handlePostSuccess}
            onCancel={() => setShowPostForm(false)}
          />
        </main>
        
        <div className="pb-20 md:pb-0" /> {/* Bottom nav spacing */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={unreadCount}
        />
      </div>
    )
  }

  // Show notifications overlay  
  if (showNotifications) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header
          onCreatePost={() => setShowPostForm(true)}
          onNotificationClick={handleBellClick}
          onSignOut={handleSignOut}
          unreadCount={unreadCount}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
        />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setShowNotifications(false)}>
              Back to Dashboard
            </Button>
          </div>
          <NotificationsFeed />
        </main>
        
        <div className="pb-20 md:pb-0" /> {/* Bottom nav spacing */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'notifications') {
              return // Already on notifications
            }
            setShowNotifications(false)
            setActiveTab(tab)
          }}
          unreadCount={unreadCount}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Enhanced Header */}
      <Header
        onCreatePost={() => setShowPostForm(true)}
        onNotificationClick={handleBellClick}
        onSignOut={handleSignOut}
        unreadCount={unreadCount}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 hidden md:block">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-transparent p-1`}>
              <TabsTrigger 
                value="home" 
                className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Home className="h-4 w-4" />
                <span>Home Feed</span>
              </TabsTrigger>
              <TabsTrigger 
                value="search" 
                className="flex items-center space-x-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600"
              >
                <Users className="h-4 w-4" />
                <span>Discovery</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center space-x-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex items-center space-x-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-600"
              >
                <Settings className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="flex items-center space-x-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="home" className="mt-0">
            <div className="mb-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {profile?.account_type === 'society' 
                    ? 'Share Updates with Your Community' 
                    : 'Your Personal Campus Feed'
                  }
                </h2>
                <p className="text-gray-600 mt-1">
                  {profile?.account_type === 'society'
                    ? 'Create posts to engage with your followers and grow your community'
                    : 'Discover what\'s happening in your followed societies and across campus'
                  }
                </p>
              </div>
            </div>
            
            <HomeFeed />
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <SearchAndDiscovery 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery}
            />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationsFeed />
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {profile?.name || user?.email}
                      </h3>
                      <Badge variant="outline" className="mb-2 capitalize">
                        {profile?.account_type || 'Student'} Account
                      </Badge>
                      <p className="text-gray-600 mb-4">
                        {profile?.institute || 'Institution not set'}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{profile?.stats?.societies_following || 0}</span>
                          <p>Following</p>
                        </div>
                        <div>
                          <span className="font-medium">{profile?.stats?.societies_member_of || 0}</span>
                          <p>Member Of</p>
                        </div>
                      </div>
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
      
      {/* Mobile spacing for bottom navigation */}
      <div className="pb-20 md:pb-0" />
      
      {/* Enhanced Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'notifications') {
            setShowNotifications(true)
          } else {
            setActiveTab(tab)
          }
        }}
        unreadCount={unreadCount}
      />
    </div>
  )
}