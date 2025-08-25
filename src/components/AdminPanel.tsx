import React, { useState, useEffect } from 'react'
import { campusAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { CheckCircle, X, Users, AlertTriangle, BarChart3, Search, Loader2, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Society {
  id: string
  name: string
  category?: string
  institute_id?: string
  verified: boolean
  created_at: string
  verification_id?: string
  society_members: { count: number }[]
}

interface Report {
  id: string
  target_type: string
  target_id: string
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

interface User {
  id: string
  name?: string
  email: string
  institute?: string
  created_at: string
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [societies, setSocieties] = useState<Society[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [verifyingStates, setVerifyingStates] = useState<{ [key: string]: boolean }>({})
  const [resolvingStates, setResolvingStates] = useState<{ [key: string]: boolean }>({})

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

      if (societiesRes.status === 'fulfilled' && societiesRes.value?.data) {
        setSocieties(societiesRes.value.data)
      } else {
        console.error('Failed to load societies:', societiesRes.status === 'rejected' ? societiesRes.reason : 'No data')
        setSocieties([])
      }
      
      if (reportsRes.status === 'fulfilled' && reportsRes.value?.data) {
        setReports(reportsRes.value.data)
      } else {
        console.error('Failed to load reports:', reportsRes.status === 'rejected' ? reportsRes.reason : 'No data')
        setReports([])
      }
      
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
        setAnalytics(analyticsRes.value.data)
      } else {
        console.error('Failed to load analytics:', analyticsRes.status === 'rejected' ? analyticsRes.reason : 'No data')
      }
      
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        setUsers(usersRes.value.data)
      } else {
        console.error('Failed to load users:', usersRes.status === 'rejected' ? usersRes.reason : 'No data')
        setUsers([])
      }
    } catch (error: any) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySociety = async (societyId: string, approved: boolean, reason?: string) => {
    setVerifyingStates(prev => ({ ...prev, [societyId]: true }))
    try {
      await campusAPI.verifySociety(societyId, approved, reason)
      toast.success(`Society ${approved ? 'verified' : 'rejected'} successfully`)
      
      // Remove the society from the verification requests list
      setSocieties(prev => prev.filter(s => s.id !== societyId))
      
      // Reload analytics to get updated counts
      const analyticsRes = await campusAPI.getAdminAnalytics()
      if (analyticsRes?.data) {
        setAnalytics(analyticsRes.data)
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      toast.error(error.message || 'Failed to update society verification')
    } finally {
      setVerifyingStates(prev => ({ ...prev, [societyId]: false }))
    }
  }

  const handleResolveReport = async (reportId: string, action: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the resolution')
      return
    }
    
    setResolvingStates(prev => ({ ...prev, [reportId]: true }))
    try {
      await campusAPI.resolveReport(reportId, action, reason)
      toast.success('Report resolved successfully')
      
      // Remove the report from the pending reports list
      setReports(prev => prev.filter(r => r.id !== reportId))
      
      // Reload analytics to get updated counts
      const analyticsRes = await campusAPI.getAdminAnalytics()
      if (analyticsRes?.data) {
        setAnalytics(analyticsRes.data)
      }
    } catch (error: any) {
      console.error('Report resolution error:', error)
      toast.error(error.message || 'Failed to resolve report')
    } finally {
      setResolvingStates(prev => ({ ...prev, [reportId]: false }))
    }
  }

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      loadAdminData()
      return
    }
    
    try {
      setLoading(true)
      const response = await campusAPI.getUsers({ search: searchTerm.trim() })
      if (response?.data) {
        setUsers(response.data)
      }
    } catch (error: any) {
      console.error('User search error:', error)
      toast.error(error.message || 'Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !analytics && societies.length === 0) {
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
          <TabsTrigger value="verification">Society Verification ({societies.length})</TabsTrigger>
          <TabsTrigger value="reports">Content Reports ({reports.length})</TabsTrigger>
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
                      <p className="text-xs text-gray-500">
                        {society.society_members[0]?.count || 0} members • {society.category || 'No category'}
                      </p>
                    </div>
                    <Badge variant={society.verified ? 'default' : 'secondary'}>
                      {society.verified ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                ))}
                {societies.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent society activity</p>
                )}
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
              {societies.length > 0 ? (
                <div className="space-y-4">
                  {societies.map((society) => (
                    <div key={society.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{society.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{society.institute_id}</span>
                            {society.category && (
                              <Badge variant="outline">{society.category}</Badge>
                            )}
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {society.society_members[0]?.count || 0} members
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Submitted {formatDistanceToNow(new Date(society.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifySociety(society.id, true)}
                            disabled={verifyingStates[society.id]}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {verifyingStates[society.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifySociety(society.id, false, 'Does not meet verification criteria')}
                            disabled={verifyingStates[society.id]}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {verifyingStates[society.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No societies pending verification</p>
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
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onResolve={handleResolveReport}
                      isResolving={resolvingStates[report.id]}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
              <CardTitle>User Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  />
                </div>
                <Button onClick={searchUsers} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
              
              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {user.institute && `${user.institute} • `}
                          Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </p>
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

// Individual Report Card Component
interface ReportCardProps {
  report: Report
  onResolve: (reportId: string, action: string, reason: string) => Promise<void>
  isResolving: boolean
}

function ReportCard({ report, onResolve, isResolving }: ReportCardProps) {
  const [reason, setReason] = useState('')
  const [showReasonInput, setShowReasonInput] = useState(false)

  const handleResolve = (action: string) => {
    if (!showReasonInput) {
      setShowReasonInput(true)
      return
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for the resolution')
      return
    }
    
    onResolve(report.id, action, reason)
    setReason('')
    setShowReasonInput(false)
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline">{report.target_type}</Badge>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="font-medium text-gray-900 mb-1">Report Reason:</p>
          <p className="text-gray-700">{report.reason}</p>
          <p className="text-xs text-gray-500 mt-2">Reporter ID: {report.reporter_id}</p>
        </div>
      </div>
      
      {showReasonInput && (
        <div className="mb-3">
          <Textarea
            placeholder="Provide a reason for your decision..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={() => handleResolve('dismiss')}
          disabled={isResolving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isResolving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          {showReasonInput ? 'Dismiss Report' : 'Dismiss'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResolve('action_taken')}
          disabled={isResolving}
          className="border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          {isResolving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-1" />
          )}
          {showReasonInput ? 'Take Action' : 'Action Required'}
        </Button>
        {showReasonInput && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowReasonInput(false)
              setReason('')
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}