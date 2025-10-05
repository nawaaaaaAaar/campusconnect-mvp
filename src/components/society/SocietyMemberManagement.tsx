// Society Member Management Component - Production Implementation with Real API Integration
// PRD Section 5.7: Handles roster management and member invitations with real database

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { UserPlus, Users, Mail, Clock, CheckCircle, X, Send, Loader2, AlertCircle } from 'lucide-react'
import { campusAPI } from '../../lib/api'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface SocietyMemberManagementProps {
  societyId: string
  onClose: () => void
}

interface Member {
  user_id: string
  name?: string
  email?: string
  role: string
  joined_at: string
  avatar_url?: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  expires_at: string
  invited_by?: string
  responded_at?: string
}

export function SocietyMemberManagement({ societyId, onClose }: SocietyMemberManagementProps) {
  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState('member')
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Load both members and invitations
      const [membersRes, invitationsRes] = await Promise.allSettled([
        campusAPI.getSocietyMembers(societyId),
        campusAPI.getSocietyInvitations(societyId)
      ])

      // Handle members data
      if (membersRes.status === 'fulfilled' && membersRes.value?.data) {
        setMembers(membersRes.value.data)
      } else if (membersRes.status === 'rejected') {
        console.error('Failed to load members:', membersRes.reason)
        // Use empty array if members can't be loaded
        setMembers([])
      }
      
      // Handle invitations data  
      if (invitationsRes.status === 'fulfilled' && invitationsRes.value?.data) {
        setInvitations(invitationsRes.value.data)
      } else if (invitationsRes.status === 'rejected') {
        console.error('Failed to load invitations:', invitationsRes.reason)
        setInvitations([])
      }
      
    } catch (error: any) {
      console.error('Failed to load member data:', error)
      setError(error.message || 'Failed to load member information')
      toast.error('Failed to load member information')
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const sendInvitation = async () => {
    if (!newInviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newInviteEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Check if email is already invited or a member
    const existingInvite = invitations.find(
      inv => inv.email.toLowerCase() === newInviteEmail.toLowerCase() && inv.status === 'pending'
    )
    if (existingInvite) {
      toast.error('This email already has a pending invitation')
      return
    }

    const existingMember = members.find(
      member => member.email?.toLowerCase() === newInviteEmail.toLowerCase()
    )
    if (existingMember) {
      toast.error('This person is already a member of the society')
      return
    }

    setInviteLoading(true)
    try {
      const response = await campusAPI.sendSocietyInvitation(
        societyId,
        newInviteEmail.trim(),
        newInviteRole
      )
      
      // Add new invitation to the list
      if (response?.data) {
        setInvitations(prev => [response.data, ...prev])
        setNewInviteEmail('')
        toast.success('Invitation sent successfully!')
      }
    } catch (error: any) {
      console.error('Invitation error:', error)
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />Pending
          </Badge>
        )
      case 'accepted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />Accepted
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
            <X className="h-3 w-3 mr-1" />Rejected
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            <AlertCircle className="h-3 w-3 mr-1" />Expired
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const colorClass = role === 'admin' 
      ? 'bg-purple-100 text-purple-700 border-purple-300' 
      : 'bg-blue-100 text-blue-700 border-blue-300'
    
    return (
      <Badge variant="outline" className={colorClass}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const isInvitationExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading member management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Members ({members.length})</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Invitations ({invitations.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Society Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.name || member.email || 'Unknown Member'}
                          </p>
                          {member.email && member.name && (
                            <p className="text-sm text-gray-600">{member.email}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(member.role)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No members found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Invite people to join your society using the Invitations tab
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="mt-6">
          <div className="space-y-6">
            {/* Send New Invitation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  <span>Send Invitation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !inviteLoading && sendInvitation()}
                      disabled={inviteLoading}
                    />
                  </div>
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                    disabled={inviteLoading}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button 
                    onClick={sendInvitation} 
                    disabled={inviteLoading || !newInviteEmail.trim()}
                    className="min-w-[100px]"
                  >
                    {inviteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Invitations List */}
            <Card>
              <CardHeader>
                <CardTitle>Sent Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length > 0 ? (
                  <div className="space-y-3">
                    {invitations.map((invitation) => {
                      const expired = isInvitationExpired(invitation.expires_at)
                      return (
                        <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{invitation.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {getRoleBadge(invitation.role)}
                              <span className="text-xs text-gray-500">
                                Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                              </span>
                              {invitation.responded_at && (
                                <span className="text-xs text-gray-500">
                                  • Responded {formatDistanceToNow(new Date(invitation.responded_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                            {expired && invitation.status === 'pending' && (
                              <p className="text-xs text-red-500 mt-1">
                                Expired {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(expired && invitation.status === 'pending' ? 'expired' : invitation.status)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No invitations sent yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Use the form above to invite new members to your society
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}