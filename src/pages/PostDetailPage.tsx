import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { ArrowLeft, Heart, MessageCircle, Share, Star, Loader2, ExternalLink } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Post {
  id: string
  society_id: string
  author_id: string
  type: string
  text: string
  media_url?: string
  link_url?: string
  created_at: string
  updated_at?: string
  is_edited?: boolean
  has_liked?: boolean
  likes_count?: number
  comments_count?: number
  societies?: {
    id: string
    name: string
    verified: boolean
    category?: string
  }
}

interface Comment {
  id: string
  post_id: string
  author_id: string
  text: string
  created_at: string
  profiles?: {
    id: string
    name?: string
    avatar_url?: string
  }
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadPost()
      loadComments()
    }
  }, [id])

  const loadPost = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const response = await campusAPI.getPost(id)
      setPost(response.data)
    } catch (error: any) {
      console.error('Post load error:', error)
      toast.error('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    if (!id) return
    
    try {
      const response = await campusAPI.getComments(id, { limit: 50 })
      setComments(response.data || [])
    } catch (error: any) {
      console.error('Comments load error:', error)
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      if (post.has_liked) {
        await campusAPI.unlikePost(post.id)
      } else {
        await campusAPI.likePost(post.id)
      }
      
      setPost(prev => prev ? {
        ...prev,
        has_liked: !prev.has_liked,
        likes_count: (prev.likes_count || 0) + (prev.has_liked ? -1 : 1)
      } : null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update like status')
    }
  }

  const handleShare = async () => {
    if (!post) return

    try {
      const shareUrl = window.location.href
      const shareData = {
        title: `${post.societies?.name} on CampusConnect`,
        text: post.text.substring(0, 100) + (post.text.length > 100 ? '...' : ''),
        url: shareUrl
      }

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast.success('Post shared!')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
      }
    } catch (error: any) {
      console.error('Share error:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || !id) return

    setCommentLoading(true)
    try {
      const response = await campusAPI.addComment(id, newComment.trim())
      setComments(prev => [response.data, ...prev])
      setNewComment('')
      setPost(prev => prev ? {
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      } : null)
      toast.success('Comment added!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post not found</h2>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <h1 className="ml-4 text-lg font-semibold">Post</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Post Header */}
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                      {post.societies?.name?.substring(0, 2).toUpperCase() || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {post.societies?.name || 'Unknown Society'}
                      </h3>
                      {post.societies?.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {post.societies?.category && (
                        <Badge variant="outline" className="text-xs">
                          {post.societies.category}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                      {post.is_edited && (
                        <Badge variant="outline" className="text-xs">
                          edited
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p className="text-gray-900 whitespace-pre-wrap text-lg">{post.text}</p>
              
              {post.media_url && (
                <div className="mt-3">
                  {post.type === 'image' ? (
                    <img 
                      src={post.media_url} 
                      alt="Post media" 
                      className="rounded-lg max-w-full h-auto"
                    />
                  ) : post.type === 'video' ? (
                    <video 
                      src={post.media_url} 
                      controls 
                      className="rounded-lg max-w-full h-auto"
                    />
                  ) : null}
                </div>
              )}
              
              {post.link_url && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <a 
                      href={post.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium truncate"
                    >
                      {post.link_url}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-2 ${
                    post.has_liked 
                      ? 'text-red-600 hover:text-red-700' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${post.has_liked ? 'fill-current' : ''}`} />
                  <span>{post.likes_count || 0}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-gray-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count || 0}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Comments ({comments.length})
          </h2>

          {/* Add Comment Form */}
          {profile && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {newComment.length}/500 characters
                    </span>
                    <Button 
                      type="submit"
                      disabled={!newComment.trim() || commentLoading}
                      size="sm"
                    >
                      {commentLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post Comment'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                        {comment.profiles?.name?.substring(0, 1) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.profiles?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No comments yet</p>
                <p className="text-sm text-gray-500 mt-1">Be the first to comment!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

