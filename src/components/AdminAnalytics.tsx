import React, { useState, useEffect } from 'react'
import { 
  BarChart3, Users, TrendingUp, Eye, Heart, MessageSquare,
  Share2, Calendar, Filter, Download, RefreshCw,
  AlertTriangle, Shield, CheckCircle, XCircle,
  Activity, Globe, Target, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalPosts: number
    totalSocieties: number
    totalInteractions: number
    growthRate: number
  }
  recentActivity: Array<{
    id: string
    type: 'signup' | 'post' | 'like' | 'comment' | 'follow'
    user: string
    timestamp: string
    details?: string
  }>
  societyMetrics: Array<{
    id: string
    name: string
    members: number
    posts: number
    engagement: number
    category: string
  }>
  topContent: Array<{
    id: string
    title: string
    author: string
    likes: number
    comments: number
    shares: number
    timestamp: string
  }>
  moderationStats: {
    pendingReports: number
    resolvedReports: number
    flaggedContent: number
    verifiedUsers: number
  }
}

interface AdminAnalyticsProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminAnalytics({ isOpen, onClose }: AdminAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAnalytics()
    }
  }, [isOpen, dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock analytics data (in real app, this would come from your analytics API)
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 2847,
          activeUsers: 1623,
          totalPosts: 5893,
          totalSocieties: 156,
          totalInteractions: 12456,
          growthRate: 12.4
        },
        recentActivity: [
          {
            id: '1',
            type: 'signup',
            user: 'john.doe@university.edu',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            details: 'New student account created'
          },
          {
            id: '2',
            type: 'post',
            user: 'tech.society@university.edu',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            details: 'Posted about upcoming tech event'
          },
          {
            id: '3',
            type: 'like',
            user: 'jane.smith@university.edu',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            details: 'Liked post from Computer Science Society'
          }
        ],
        societyMetrics: [
          {
            id: '1',
            name: 'Computer Science Society',
            members: 342,
            posts: 89,
            engagement: 85,
            category: 'Academic'
          },
          {
            id: '2',
            name: 'Arts & Culture Club',
            members: 278,
            posts: 67,
            engagement: 72,
            category: 'Arts'
          },
          {
            id: '3',
            name: 'Sports Society',
            members: 195,
            posts: 45,
            engagement: 68,
            category: 'Sports'
          }
        ],
        topContent: [
          {
            id: '1',
            title: 'New AI Research Opportunities Available',
            author: 'Dr. Sarah Johnson',
            likes: 87,
            comments: 23,
            shares: 12,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          },
          {
            id: '2',
            title: 'Campus Hackathon 2025 Registration Open',
            author: 'Tech Society',
            likes: 73,
            comments: 18,
            shares: 25,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
          }
        ],
        moderationStats: {
          pendingReports: 8,
          resolvedReports: 23,
          flaggedContent: 15,
          verifiedUsers: 1247
        }
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup': return <Users className="h-4 w-4 text-green-500" />
      case 'post': return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'like': return <Heart className="h-4 w-4 text-red-500" />
      case 'comment': return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'follow': return <Users className="h-4 w-4 text-orange-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Analytics</h2>
              <p className="text-sm text-gray-500">Platform insights and moderation tools</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={refreshAnalytics}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Users</p>
                      <p className="text-2xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</p>
                      <p className="text-blue-100 text-sm">+{analytics.overview.growthRate}% this month</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active Users</p>
                      <p className="text-2xl font-bold">{analytics.overview.activeUsers.toLocaleString()}</p>
                      <p className="text-green-100 text-sm">
                        {Math.round((analytics.overview.activeUsers / analytics.overview.totalUsers) * 100)}% of total
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Posts</p>
                      <p className="text-2xl font-bold">{analytics.overview.totalPosts.toLocaleString()}</p>
                      <p className="text-purple-100 text-sm">
                        {Math.round(analytics.overview.totalInteractions / analytics.overview.totalPosts * 100) / 100} avg interactions
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Societies</p>
                      <p className="text-2xl font-bold">{analytics.overview.totalSocieties}</p>
                      <p className="text-orange-100 text-sm">
                        {Math.round(analytics.overview.totalUsers / analytics.overview.totalSocieties)} avg members
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Recent Activity & Moderation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analytics.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.user}
                          </p>
                          <p className="text-xs text-gray-500">{activity.details}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Moderation Stats */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Moderation
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-lg font-bold text-yellow-900">{analytics.moderationStats.pendingReports}</p>
                      <p className="text-xs text-yellow-700">Pending Reports</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-lg font-bold text-green-900">{analytics.moderationStats.resolvedReports}</p>
                      <p className="text-xs text-green-700">Resolved Reports</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <p className="text-lg font-bold text-red-900">{analytics.moderationStats.flaggedContent}</p>
                      <p className="text-xs text-red-700">Flagged Content</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-lg font-bold text-blue-900">{analytics.moderationStats.verifiedUsers}</p>
                      <p className="text-xs text-blue-700">Verified Users</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Society Performance */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Top Performing Societies
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Society</th>
                        <th className="text-right py-2">Members</th>
                        <th className="text-right py-2">Posts</th>
                        <th className="text-right py-2">Engagement</th>
                        <th className="text-center py-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.societyMetrics.map((society) => (
                        <tr key={society.id} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">{society.name}</td>
                          <td className="py-3 text-right text-gray-600">{society.members}</td>
                          <td className="py-3 text-right text-gray-600">{society.posts}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              society.engagement >= 80 ? 'bg-green-100 text-green-800' :
                              society.engagement >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {society.engagement}%
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              {society.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Top Performing Content
                </h3>
                <div className="space-y-4">
                  {analytics.topContent.map((content, index) => (
                    <div key={content.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                        <p className="text-sm text-gray-600">by {content.author}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Heart className="h-3 w-3 mr-1 text-red-500" />
                            {content.likes}
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1 text-blue-500" />
                            {content.comments}
                          </span>
                          <span className="flex items-center">
                            <Share2 className="h-3 w-3 mr-1 text-green-500" />
                            {content.shares}
                          </span>
                          <span>{getTimeAgo(content.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
