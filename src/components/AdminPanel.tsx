import React, { useState, useEffect } from 'react'
import { campusAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { CheckCircle, X, Users, AlertTriangle, BarChart3, Search, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Society {
  id: string
  name: string
  category?: string
  verified: boolean
  created_at: string
  society_members: { count: number }[]
}

interface Report {
  id: string
  reported_content_type: string
  reason: string
  status: string
  created_at: string
  reporter_id: string
}

interface AdminAnalytics {
  new_societies: number
  new_posts: number
  new_users: number
  pending_reports: number
  date_range: string
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [societies, setSocieties] = useState<Society[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [societiesRes, reportsRes, analyticsRes, usersRes] = await Promise.allSettled([
        campusAPI.getVerificationRequests(),
        campusAPI.getReports(),
        campusAPI.getAdminAnalytics(),
        campusAPI.getUsers({ limit: 20 })
      ])

      if (societiesRes.status === 'fulfilled') {
        setSocieties(societiesRes.value.data || [])
      }
      if (reportsRes.status === 'fulfilled') {
        setReports(reportsRes.value.data || [])
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data)
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || [])
      }
    } catch (error: any) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySociety = async (societyId: string, approved: boolean) => {
    try {
      await campusAPI.verifySociety(societyId, approved)
      toast.success(`Society ${approved ? 'verified' : 'rejected'} successfully`)
      loadAdminData()
    } catch (error: any) {
      toast.error('Failed to update society verification')
    }
  }

  const handleResolveReport = async (reportId: string, action: string, reason: string) => {
    try {
      await campusAPI.resolveReport(reportId, action, reason)
      toast.success('Report resolved successfully')
      loadAdminData()
    } catch (error: any) {
      toast.error('Failed to resolve report')
    }
  }

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      loadAdminData()
      return
    }
    
    try {
      const response = await campusAPI.getUsers({ search: searchTerm })
      setUsers(response.data || [])
    } catch (error: any) {
      toast.error('Failed to search users')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="text-gray-600">Manage societies, reports, and platform health</p>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verification">Society Verification</TabsTrigger>
          <TabsTrigger value="reports">Content Reports</TabsTrigger>
          <TabsTrigger value="users">User Directory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="text-center py-6">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{analytics.new_societies}</p>
                  <p className="text-sm text-gray-600">New Societies</p>
                  <p className="text-xs text-gray-500">Last {analytics.date_range}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="text-center py-6">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{analytics.new_users}</p>
                  <p className="text-sm text-gray-600">New Users</p>
                  <p className="text-xs text-gray-500">Last {analytics.date_range}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="text-center py-6">
                  <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{analytics.new_posts}</p>
                  <p className="text-sm text-gray-600">New Posts</p>
                  <p className="text-xs text-gray-500">Last {analytics.date_range}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="text-center py-6">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{analytics.pending_reports}</p>
                  <p className="text-sm text-gray-600">Pending Reports</p>
                  <p className="text-xs text-gray-500">Requires attention</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {societies.slice(0, 5).map((society) => (
                  <div key={society.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{society.name}</p>
                      <p className="text-sm text-gray-600">
                        Created {formatDistanceToNow(new Date(society.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={society.verified ? 'default' : 'secondary'}>
                      {society.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Society Verification Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {societies.filter(s => !s.verified).length > 0 ? (
                <div className="space-y-4">
                  {societies.filter(s => !s.verified).map((society) => (
                    <div key={society.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{society.name}</h3>
                          <p className="text-sm text-gray-600">
                            {society.category} • {society.society_members?.[0]?.count || 0} members
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {formatDistanceToNow(new Date(society.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifySociety(society.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifySociety(society.id, false)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No pending verification requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Report: {report.reason}</p>
                          <p className="text-sm text-gray-600">
                            Content Type: {report.reported_content_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolveReport(report.id, 'content_removed', 'Inappropriate content')}
                          >
                            Remove Content
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(report.id, 'no_action', 'No violation found')}
                          >
                            No Action
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No pending reports</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Directory</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    className="w-64"
                  />
                  <Button onClick={searchUsers}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-600">
                          {user.name || 'No name provided'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>Institute: {user.institute || 'Not specified'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}