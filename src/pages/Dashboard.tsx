import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { BottomNavigation } from '../components/BottomNavigation'
import { HomeFeed } from '../components/HomeFeed'
import { SocietiesDiscovery } from '../components/SocietiesDiscovery'
import { NotificationsFeed } from '../components/NotificationsFeed'
import { PostCreationForm } from '../components/PostCreationForm'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Home, Users, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../lib/supabase'
import { toast } from 'sonner'

export function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [showPostCreation, setShowPostCreation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    // Register service worker for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const params = new URLSearchParams()
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string
      const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string
      const appId = import.meta.env.VITE_FIREBASE_APP_ID as string
      const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string

      if (apiKey) params.set('apiKey', apiKey)
      if (authDomain) params.set('authDomain', authDomain)
      if (projectId) params.set('projectId', projectId)
      if (messagingSenderId) params.set('messagingSenderId', messagingSenderId)
      if (appId) params.set('appId', appId)
      if (storageBucket) params.set('storageBucket', storageBucket)

      const swUrl = `/firebase-messaging-sw.js${params.toString() ? `?${params.toString()}` : ''}`
      navigator.serviceWorker.register(swUrl).catch(() => {})
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth')
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  const handleCreatePost = () => {
    if (profile?.account_type === 'society') {
      setShowPostCreation(true)
    } else {
      toast.info('Only society accounts can create posts')
    }
  }

  const handleNotificationClick = () => {
    setActiveTab('notifications')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Map tab IDs from BottomNavigation to our tab names
    if (tab === 'search') {
      setActiveTab('discover')
    } else if (tab === 'create') {
      handleCreatePost()
    } else if (tab === 'profile') {
      // TODO: Navigate to profile page when implemented
      toast.info('Profile page coming soon!')
    } else {
      setActiveTab(tab)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query) {
      setActiveTab('discover')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <Header
        onCreatePost={handleCreatePost}
        onNotificationClick={handleNotificationClick}
        onSignOut={handleSignOut}
        unreadCount={unreadNotifications}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      {/* Desktop Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b-0 h-12 p-0 space-x-8">
              <TabsTrigger 
                value="home" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 bg-transparent"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="discover"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 bg-transparent"
              >
                <Users className="h-4 w-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 bg-transparent relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && <HomeFeed />}
        {activeTab === 'discover' && <SocietiesDiscovery />}
        {activeTab === 'notifications' && (
          <NotificationsFeed />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab === 'discover' ? 'search' : activeTab}
        onTabChange={handleTabChange}
        unreadCount={unreadNotifications}
      />

      {/* Post Creation Modal */}
      {showPostCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PostCreationForm
              onCancel={() => setShowPostCreation(false)}
              onSuccess={() => {
                setShowPostCreation(false)
                setActiveTab('home')
                toast.success('Post created successfully!')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}