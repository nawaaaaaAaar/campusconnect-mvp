import React, { useState, useEffect, useCallback } from 'react'
import { campusAPI, type Society, type Post } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Users, CheckCircle, UserPlus, UserMinus, MapPin, Calendar, Globe, Mail, Loader2, MessageCircle, Heart, Share2, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { MemberSocietyCommunication } from './MemberSocietyCommunication'

interface SocietyProfileProps {
  societyId: string
  onBack?: () => void
}

interface SocietyMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  profiles?: {
    id: string
    email: string
    name?: string
    avatar_url?: string
  }
}

interface PostWithDetails extends Post {
  societies?: {
    id: string
    name: string
    logo_url?: string
    verified: boolean
  }
  profiles?: {
    id: string
    name?: string
    email?: string
    avatar_url?: string
  }
}

export function SocietyProfile({ societyId, onBack }: SocietyProfileProps) {
  const navigate = useNavigate()
  const [society, setSociety] = useState<Society | null>(null)
  const [members, setMembers] = useState<SocietyMember[]>([])
  const [posts, setPosts] = useState<PostWithDetails[]>([])
  const [activeTab, setActiveTab] = useState('posts')
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadSocietyData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await campusAPI.getSociety(societyId)
      setSociety(response.data)
    } catch (error: any) {
      toast.error('Failed to load society details')
      console.error('Society load error:', error)
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    loadSocietyData()
  }, [loadSocietyData])

  const loadMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const response = await fetch(`https://egdavxjkyxvawgguqmvx.supabase.co/rest/v1/society_members?society_id=eq.${societyId}&select=*,profiles(id,email,name,avatar_url)`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGF2eGpreXh2YXdnZ3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTMzNDQsImV4cCI6MjA3MTUyOTM0NH0.TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4',
          'Content-Type': 'application/json'
        }
      })
      const membersData = await response.json()
      setMembers(membersData || [])
    } catch (error: any) {
      console.error('Members load error:', error)
    } finally {
      setMembersLoading(false)
    }
  }, [societyId])

  const loadPosts = useCallback(async () => {
    setPostsLoading(true)
    try {
      // Fetch posts directly from Supabase for this society
      const response = await fetch(`https://egdavxjkyxvawgguqmvx.supabase.co/rest/v1/posts?society_id=eq.${societyId}&select=*,societies(id,name,logo_url,verified),profiles(id,name,email,avatar_url)&order=created_at.desc&limit=20`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGF2eGpreXh2YXdnZ3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTMzNDQsImV4cCI6MjA3MTUyOTM0NH0.TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4',
          'Content-Type': 'application/json'
        }
      })
      const postsData = await response.json()
      setPosts(postsData || [])
    } catch (error: any) {
      console.error('Posts load error:', error)
      toast.error('Failed to load posts')
    } finally {
      setPostsLoading(false)
    }
  }, [societyId])
  
  const handleLike = async (postId: string) => {
    try {
      await campusAPI.likePost(postId)
      // Update the post in the list
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, has_liked: true, likes_count: (post.likes_count || 0) + 1 }
          : post
      ))
    } catch (error: any) {
      toast.error('Failed to like post')
    }
  }
  
  const handleUnlike = async (postId: string) => {
    try {
      await campusAPI.unlikePost(postId)
      // Update the post in the list
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, has_liked: false, likes_count: Math.max((post.likes_count || 0) - 1, 0) }
          : post
      ))
    } catch (error: any) {
      toast.error('Failed to unlike post')
    }
  }

  useEffect(() => {
    if (activeTab === 'members' && members.length === 0) {
      loadMembers()
    }
    if (activeTab === 'posts' && posts.length === 0) {
      loadPosts()
    }
  }, [activeTab, loadMembers, loadPosts, members.length, posts.length])

  const handleFollowToggle = async () => {
    if (!society) return
    
    setActionLoading(true)
    try {
      if (society.is_following) {
        await campusAPI.unfollowSociety(society.id)
        setSociety(prev => prev ? { ...prev, is_following: false } : null)
        toast.success('Unfollowed society')
      } else {
        await campusAPI.followSociety(society.id)
        setSociety(prev => prev ? { ...prev, is_following: true } : null)
        toast.success('Following society')
      }
    } catch (error: any) {
      toast.error('Failed to update follow status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading society details...</p>
        </div>
      </div>
    )
  }

  if (!society) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Society not found</p>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    )
  }

  const followersCount = society.society_followers?.[0]?.count || 0
  const membersCount = society.society_members?.[0]?.count || 0
  const postsCount = society.posts?.[0]?.count || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Back to Societies
        </Button>
      )}

      {/* Society Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {society.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{society.name}</h1>
                    {society.verified && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  {society.category && (
                    <Badge variant="secondary" className="mb-2">
                      {society.category}
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={handleFollowToggle}
                  disabled={actionLoading}
                  className={society.is_following ? 
                    "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400" : 
                    "bg-blue-600 hover:bg-blue-700"
                  }
                  variant={society.is_following ? "outline" : "default"}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : society.is_following ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {society.is_following ? 'Unfollow' : 'Follow'}
                </Button>
              </div>

              {/* Society Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{followersCount} followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{membersCount} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{postsCount} posts</span>
                </div>
              </div>

              {/* Society Description */}
              {society.description && (
                <p className="text-gray-700 leading-relaxed">
                  {society.description}
                </p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {society.contact_email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{society.contact_email}</span>
                  </div>
                )}
                {society.website && (
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <a href={society.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {society.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Society Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {postsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.societies?.logo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                            {society.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{society.name}</p>
                          {post.profiles?.name && (
                            <p className="text-xs text-gray-500">
                              Posted by {post.profiles.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {society.verified && (
                        <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Post Content */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      {post.text && (
                        <p className="text-gray-900 mb-3 leading-relaxed whitespace-pre-wrap">
                          {post.text.length > 300 ? (
                            <>
                              {post.text.substring(0, 300)}...
                              <span className="text-blue-600 hover:underline ml-1">See more</span>
                            </>
                          ) : (
                            post.text
                          )}
                        </p>
                      )}
                      
                      {/* Media Display */}
                      {post.media_url && (
                        <div className="mb-3 -mx-4">
                          {post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={post.media_url} 
                              alt="Post media" 
                              className="w-full object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
                            />
                          ) : post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video 
                              src={post.media_url} 
                              controls 
                              className="w-full max-h-96"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <p className="text-gray-500">📎 Media attachment</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Engagement Stats */}
                    {(post.likes_count > 0 || post.comments_count > 0) && (
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2 pt-2 border-t">
                        <div className="flex items-center space-x-4">
                          {post.likes_count > 0 && (
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                              <span>{post.likes_count}</span>
                            </span>
                          )}
                        </div>
                        {post.comments_count > 0 && (
                          <button 
                            onClick={() => navigate(`/post/${post.id}`)}
                            className="hover:underline"
                          >
                            {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Action Buttons (Facebook-like) */}
                    <div className="flex items-center justify-around border-t pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 hover:bg-gray-50 ${post.has_liked ? 'text-red-600' : 'text-gray-600'}`}
                        onClick={() => post.has_liked ? handleUnlike(post.id) : handleLike(post.id)}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${post.has_liked ? 'fill-red-600' : ''}`} />
                        {post.has_liked ? 'Liked' : 'Like'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 hover:bg-gray-50 text-gray-600"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 hover:bg-gray-50 text-gray-600"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                          toast.success('Link copied to clipboard!')
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No posts yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  This society hasn't posted anything yet. Follow them to see updates when they do!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About {society.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {society.description ? (
                <p className="text-gray-700 leading-relaxed">{society.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description available.</p>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {society.category && (
                  <div>
                    <span className="font-medium text-gray-900">Category:</span>
                    <p className="text-gray-700">{society.category}</p>
                  </div>
                )}
                {society.institute_id && (
                  <div>
                    <span className="font-medium text-gray-900">Institute:</span>
                    <p className="text-gray-700">{society.institute_id}</p>
                  </div>
                )}
                {society.contact_email && (
                  <div>
                    <span className="font-medium text-gray-900">Contact Email:</span>
                    <p className="text-gray-700">{society.contact_email}</p>
                  </div>
                )}
                {society.website && (
                  <div>
                    <span className="font-medium text-gray-900">Website:</span>
                    <a href={society.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {society.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Society Members ({membersCount})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading members...</p>
                </div>
              ) : members.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {member.profiles?.name ? 
                            member.profiles.name.substring(0, 2).toUpperCase() :
                            member.profiles?.email?.substring(0, 2).toUpperCase() || '?'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {member.profiles?.name || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.profiles?.email}
                        </p>
                        {member.role !== 'member' && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No members to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <MemberSocietyCommunication 
            societyId={societyId} 
            societyName={society.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}