import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { MessageSquare, Send, Clock, AlertCircle, CheckCircle, Loader2, User, Users, Mail } from 'lucide-react'
import { campusAPI, type MemberSocietyMessage } from '../lib/api'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'

interface MemberSocietyCommunicationProps {
  societyId: string
  societyName: string
  onClose?: () => void
}

interface MemberStatus {
  isMember: boolean
  role?: string
  joined_at?: string
}

export function MemberSocietyCommunication({ societyId, societyName, onClose }: MemberSocietyCommunicationProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('messages')
  const [messages, setMessages] = useState<MemberSocietyMessage[]>([])
  const [memberStatus, setMemberStatus] = useState<MemberStatus>({ isMember: false })
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    message_type: 'message' as 'message' | 'announcement' | 'feedback',
    is_urgent: false
  })

  const loadMemberStatus = useCallback(async () => {
    try {
      const response = await campusAPI.checkMemberStatus(societyId)
      setMemberStatus(response.data || { isMember: false })
    } catch (error: any) {
      console.error('Failed to check member status:', error)
      setMemberStatus({ isMember: false })
    }
  }, [societyId])

  const loadMessages = useCallback(async () => {
    if (!memberStatus.isMember) return
    
    setLoading(true)
    try {
      const response = await campusAPI.getMemberMessages(societyId, {
        limit: 20,
        offset: 0
      })
      setMessages(response.data || [])
    } catch (error: any) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [societyId, memberStatus.isMember])

  useEffect(() => {
    loadMemberStatus()
  }, [loadMemberStatus])

  useEffect(() => {
    if (memberStatus.isMember) {
      loadMessages()
    }
  }, [memberStatus.isMember, loadMessages])

  const handleSendMessage = async () => {
    if (!newMessage.content.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (!memberStatus.isMember) {
      toast.error('Only society members can send messages')
      return
    }

    setSendingMessage(true)
    try {
      await campusAPI.sendMemberMessage(societyId, {
        subject: newMessage.subject.trim() || undefined,
        content: newMessage.content.trim(),
        message_type: newMessage.message_type,
        is_urgent: newMessage.is_urgent
      })

      // Reset form
      setNewMessage({
        subject: '',
        content: '',
        message_type: 'message',
        is_urgent: false
      })

      // Reload messages
      loadMessages()
      toast.success('Message sent successfully!')
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await campusAPI.markMessageAsRead(messageId)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
    } catch (error: any) {
      console.error('Failed to mark message as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await campusAPI.markAllMessagesAsRead(societyId)
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })))
      toast.success('All messages marked as read')
    } catch (error: any) {
      console.error('Failed to mark all messages as read:', error)
      toast.error('Failed to mark all messages as read')
    }
  }

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Announcement</Badge>
      case 'feedback':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Feedback</Badge>
      case 'message':
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Message</Badge>
    }
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

  // Show access denied if not a member
  if (!memberStatus.isMember) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Members Only</h3>
          <p className="text-gray-600 mb-4">
            Only society members can send messages to {societyName}
          </p>
          <p className="text-sm text-gray-500">
            Join the society to access member communication features
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Communication</h2>
          <p className="text-gray-600">Send messages to {societyName}</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Compose</span>
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Messages to Society</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  disabled={messages.every(msg => msg.is_read)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        message.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => !message.is_read && handleMarkAsRead(message.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender_profile?.avatar_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {getInitials(message.sender_profile?.name, message.sender_profile?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {message.sender_profile?.name || message.sender_profile?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {message.is_urgent && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {message.subject && (
                        <h4 className="font-semibold text-gray-900 mb-2">{message.subject}</h4>
                      )}
                      
                      <div className="flex items-center space-x-2 mb-2">
                        {getMessageTypeBadge(message.message_type)}
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start a conversation using the Compose tab
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-green-600" />
                <span>Send Message to {societyName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <select
                  value={newMessage.message_type}
                  onChange={(e) => setNewMessage(prev => ({ 
                    ...prev, 
                    message_type: e.target.value as 'message' | 'announcement' | 'feedback' 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="message">General Message</option>
                  <option value="feedback">Feedback/Suggestion</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject (Optional)
                </label>
                <Input
                  placeholder="Enter subject line..."
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  maxLength={255}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newMessage.content.length}/1000 characters
                </p>
              </div>

              {/* Urgent Flag */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={newMessage.is_urgent}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, is_urgent: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="urgent" className="text-sm text-gray-700 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                  Mark as urgent
                </label>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.content.trim()}
                  className="min-w-[120px]"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
