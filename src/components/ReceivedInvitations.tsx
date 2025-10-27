// Received Invitations Component - Allows users to view and respond to society invitations
// Part of the membership invitation system UI

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Mail, CheckCircle, X, Clock, Users, Loader2, AlertCircle } from 'lucide-react'
import { campusAPI, type SocietyInvitation } from '../lib/api'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export function ReceivedInvitations() {
  const [invitations, setInvitations] = useState<SocietyInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingToId, setRespondingToId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadInvitations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await campusAPI.getReceivedInvitations()
      if (response?.data) {
        setInvitations(response.data)
      } else {
        setInvitations([])
      }
    } catch (error: any) {
      console.error('Failed to load invitations:', error)
      setError(error.message || 'Failed to load invitations')
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  const respondToInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    setRespondingToId(invitationId)
    try {
      await campusAPI.respondToInvitation(invitationId, action)
      
      // Update local state
      setInvitations(prev => 
        prev.map(invitation => 
          invitation.id === invitationId 
            ? { ...invitation, status: action === 'accept' ? 'accepted' : 'rejected' as const }
            : invitation
        )
      )
      
      const message = action === 'accept' 
        ? 'Invitation accepted! Welcome to the society.' 
        : 'Invitation declined.'
      toast.success(message)
    } catch (error: any) {
      console.error('Failed to respond to invitation:', error)
      toast.error(error.message || 'Failed to respond to invitation')
    } finally {
      setRespondingToId(null)
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const isExpired = expiry < now

    if (status === 'accepted') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>
    } else if (status === 'rejected') {
      return <Badge variant="secondary">Rejected</Badge>
    } else if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    } else {
      return <Badge variant="outline">Pending</Badge>
    }
  }

  const canRespond = (invitation: SocietyInvitation) => {
    const now = new Date()
    const expiry = new Date(invitation.expires_at)
    return invitation.status === 'pending' && expiry >= now
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading invitations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadInvitations} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invitations</h3>
          <p className="text-gray-600">
            You don't have any society invitations at the moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Society Invitations</h2>
        <Badge variant="outline">{invitations.filter(i => i.status === 'pending').length} pending</Badge>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => {
          const isExpired = new Date(invitation.expires_at) < new Date()
          const isResponding = respondingToId === invitation.id
          
          return (
            <Card key={invitation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Society Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                        {invitation.societies?.name?.substring(0, 2).toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Invitation Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invitation.societies?.name || 'Unknown Society'}
                        </h3>
                        {getStatusBadge(invitation.status, invitation.expires_at)}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        You've been invited to join this society as a{' '}
                        <span className="font-medium">{invitation.role}</span>
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Invited {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                        </span>
                        {invitation.expires_at && (
                          <span>
                            {isExpired ? 'Expired' : 'Expires'} {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Actions */}
                {canRespond(invitation) && (
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => respondToInvitation(invitation.id, 'reject')}
                      disabled={isResponding}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {isResponding ? 'Declining...' : 'Decline'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respondToInvitation(invitation.id, 'accept')}
                      disabled={isResponding}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isResponding ? 'Accepting...' : 'Accept'}
                    </Button>
                  </div>
                )}

                {/* Response Status */}
                {invitation.status !== 'pending' && invitation.responded_at && (
                  <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                    {invitation.status === 'accepted' 
                      ? '✅ You accepted this invitation' 
                      : '❌ You declined this invitation'
                    }{' '}
                    {formatDistanceToNow(new Date(invitation.responded_at), { addSuffix: true })}
                  </div>
                )}

                {/* Expired Status */}
                {isExpired && invitation.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t text-sm text-red-600">
                    ⏰ This invitation has expired and can no longer be accepted.
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
