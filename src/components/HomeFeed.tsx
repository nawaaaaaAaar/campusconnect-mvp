import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { Heart, MessageCircle, Share, ExternalLink, Star, Users, TrendingUp, MoreHorizontal, Loader2, Edit, Trash2, Flag } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { EditPostDialog } from './EditPostDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { ReportDialog } from './ReportDialog'
import { telemetry } from '../lib/telemetry'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

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
  edit_count?: number
  has_liked?: boolean
  likes_count?: number
  comments_count?: number
  feed_source?: 'followed' | 'global'
  societies?: {
    id: string
    name: string
    institute_id: string
    verified: boolean
    category?: string
  }
  profiles?: {
    id: string
    name?: string
    avatar_url?: string
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
    email?: string
    avatar_url?: string
  }
}

export function HomeFeed() {
  const { profile, user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [feedMeta, setFeedMeta] = useState<any>(null)
  const [feedNudge, setFeedNudge] = useState<any>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({})
  const [newComments, setNewComments] = useState<{ [postId: string]: string }>({})
  const [commentLoading, setCommentLoading] = useState<Set<string>>(new Set())
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [deletingComment, setDeletingComment] = useState<{postId: string, commentId: string} | null>(null)
  const [reportingPost, setReportingPost] = useState<Post | null>(null)

  const loadFeed = useCallback(async (loadMore = false) => {
    setLoading(true)
    try {
      const params: any = { limit: 20 }
      if (loadMore && cursor) {
        params.cursor = cursor
      }
      
      // PRD 14: Track feed performance and impressions
      const response = await telemetry.measure(
        loadMore ? 'feed_next_page' : 'feed_first_page',
        () => campusAPI.getHomeFeed(params)
      )
      
      if (loadMore) {
        setPosts(prev => [...prev, ...response.data])
        // PRD 14: Track pagination
        telemetry.track('feed_next_page', {
          user_id: user?.id,
          post_count: response.data?.length || 0
        })
      } else {
        setPosts(response.data)
        // PRD 14: Track feed impression
        telemetry.track('feed_impression', {
          user_id: user?.id,
          post_count: response.data?.length || 0
        })
      }
      
      setCursor(response.cursor || null)
      setFeedMeta(response.meta)
      setFeedNudge(response.feed_nudge)
    } catch (error: any) {
      console.error('Feed error:', error)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [cursor, user?.id])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleLike = async (post: Post) => {
    try {
      if (post.has_liked) {
        await campusAPI.unlikePost(post.id)
      } else {
        await campusAPI.likePost(post.id)
        // PRD 14: Track post like
        telemetry.track('post_like', {
          user_id: user?.id,
          post_id: post.id,
          society_id: post.society_id
        })
      }
      
      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { 
              ...p, 
              has_liked: !p.has_liked,
              likes_count: (p.likes_count || 0) + (p.has_liked ? -1 : 1)
            }
          : p
      ))
    } catch (error: any) {
      toast.error(error.message || 'Failed to update like status')
    }
  }

  const handleShare = async (post: Post) => {
    try {
      // PRD Section 4, 5.4: Deep linking support
      const shareUrl = `${window.location.origin}/post/${post.id}`
      const shareData = {
        title: `${post.societies?.name} on CampusConnect`,
        text: post.text.substring(0, 100) + (post.text.length > 100 ? '...' : ''),
        url: shareUrl
      }

      // Use native share sheet if available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast.success('Post shared!')
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
      }
    } catch (error: any) {
      console.error('Share error:', error)
      // Don't show error for user cancellation
      if (error.name !== 'AbortError') {
        toast.error('Failed to share post')
      }
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const response = await campusAPI.getComments(postId, { limit: 10 })
      setComments(prev => ({ ...prev, [postId]: response.data }))
    } catch (error: any) {
      console.error('Comments error:', error)
      toast.error('Failed to load comments')
    }
  }

  const toggleComments = (postId: string) => {
    const expanded = expandedComments.has(postId)
    const newExpanded = new Set(expandedComments)
    
    if (expanded) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      if (!comments[postId]) {
        loadComments(postId)
      }
    }
    
    setExpandedComments(newExpanded)
  }

  const submitComment = async (postId: string) => {
    const text = newComments[postId]?.trim()
    if (!text) return

    setCommentLoading(prev => new Set(prev).add(postId))
    try {
      const response = await campusAPI.addComment(postId, text)
      
      // Update comments
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data]
      }))
      
      // Clear input
      setNewComments(prev => ({ ...prev, [postId]: '' }))
      
      // Update comment count
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments_count: (p.comments_count || 0) + 1 }
          : p
      ))
      
      toast.success('Comment added!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment')
    } finally {
      setCommentLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  // Check if post can be edited (within 15 minutes and user is author)
  const canEditPost = (post: Post): boolean => {
    if (!user || post.author_id !== user.id) return false
    
    const createdAt = new Date(post.created_at)
    const now = new Date()
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    
    return minutesElapsed <= 15
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
  }

  const handleEditSuccess = () => {
    loadFeed() // Reload feed to show updated post
  }

  // Check if user can delete post (author or society admin/owner)
  const canDeletePost = (post: Post): boolean => {
    if (!user) return false
    // Author can delete or will check admin status on backend
    return post.author_id === user.id
  }

  const handleDeletePost = async () => {
    if (!deletingPost) return

    try {
      await campusAPI.deletePost(deletingPost.id)
      toast.success('Post deleted successfully')
      
      // Remove from UI
      setPosts(prev => prev.filter(p => p.id !== deletingPost.id))
      setDeletingPost(null)
    } catch (error: any) {
      console.error('Delete post error:', error)
      toast.error(error.message || 'Failed to delete post')
    }
  }

  const handleDeleteComment = async () => {
    if (!deletingComment) return

    try {
      await campusAPI.deleteComment(deletingComment.postId, deletingComment.commentId)
      toast.success('Comment deleted successfully')
      
      // Remove from UI
      setComments(prev => ({
        ...prev,
        [deletingComment.postId]: prev[deletingComment.postId]?.filter(c => c.id !== deletingComment.commentId) || []
      }))
      
      // Update comment count
      setPosts(prev => prev.map(p => 
        p.id === deletingComment.postId 
          ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) }
          : p
      ))
      
      setDeletingComment(null)
    } catch (error: any) {
      console.error('Delete comment error:', error)
      toast.error(error.message || 'Failed to delete comment')
    }
  }

  return (
    <div className="space-y-6">
      {/* Feed Nudge for users with few follows */}
      {feedNudge && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">{feedNudge.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{feedNudge.message}</p>
                <Button size="sm" variant="outline" className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100">
                  {feedNudge.action}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Metadata - PRD Section 5.4: 2F:1G Algorithm Display */}
      {feedMeta && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600">
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{feedMeta.followed_posts} followed</span>
            </span>
            {' • '}
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>{feedMeta.global_posts} discover</span>
            </span>
            {feedMeta.followed_societies_count > 0 && (
              <>
                {' • '}
                <span className="text-green-600">
                  Following {feedMeta.followed_societies_count} societies
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Post Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.societies?.institute_id} />
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
                        <Badge 
                          variant={post.feed_source === 'followed' ? 'default' : 'outline'} 
                          className={`text-xs ${
                            post.feed_source === 'followed' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-purple-100 text-purple-700 border-purple-200'
                          }`}
                        >
                          {post.feed_source === 'followed' ? 'Following' : 'Discover'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-600">{post.societies?.institute_id}</p>
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
                  <div className="flex items-center space-x-2">
                    {canEditPost(post) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditPost(post)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeletePost(post) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeletingPost(post)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setReportingPost(post)}>
                          <Flag className="mr-2 h-4 w-4" />
                          Report post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-900 whitespace-pre-wrap">{post.text}</p>
                
                {/* Media */}
                {post.media_url && (
                  <div className="mt-3">
                    {post.type === 'image' ? (
                      <img 
                        src={post.media_url} 
                        alt="Post media" 
                        className="rounded-lg max-w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : post.type === 'video' ? (
                      <video 
                        src={post.media_url} 
                        controls 
                        className="rounded-lg max-w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : null}
                  </div>
                )}
                
                {/* Link Preview */}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post)}
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
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments_count || 0}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(post)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                    >
                      <Share className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="border-t border-gray-100">
                  {/* Add Comment */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                          {profile?.name?.substring(0, 1) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComments[post.id] || ''}
                          onChange={(e) => setNewComments(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          className="min-h-[60px] text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => submitComment(post.id)}
                          disabled={!newComments[post.id]?.trim() || commentLoading.has(post.id)}
                        >
                          {commentLoading.has(post.id) ? 'Posting...' : 'Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments List */}
                  <div className="max-h-96 overflow-y-auto">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="p-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                              {comment.profiles?.name?.substring(0, 1) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {comment.profiles?.name || (comment.profiles?.email ? comment.profiles.email.split('@')[0] : 'User')}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                {user && comment.author_id === user.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingComment({ postId: post.id, commentId: comment.id })}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-gray-800">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {comments[post.id]?.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {posts.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Your Campus Feed!
              </h3>
              <p className="text-gray-600 mb-4">
                Follow societies to see their latest posts and discover what's happening on campus.
              </p>
              <Button onClick={() => loadFeed()}>Refresh Feed</Button>
            </CardContent>
          </Card>
        )}
        
        {/* Load More */}
        {cursor && (
          <div className="text-center py-4">
            <Button 
              variant="outline" 
              onClick={() => loadFeed(true)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Posts'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Post Dialog */}
      {editingPost && (
        <EditPostDialog
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          post={editingPost}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Post Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingPost}
        onOpenChange={(open) => !open && setDeletingPost(null)}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDeletePost}
      />

      {/* Delete Comment Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingComment}
        onOpenChange={(open) => !open && setDeletingComment(null)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleDeleteComment}
      />

      {/* Report Post Dialog */}
      {reportingPost && (
        <ReportDialog
          open={!!reportingPost}
          onOpenChange={(open) => !open && setReportingPost(null)}
          targetType="post"
          targetId={reportingPost.id}
          targetDetails={{
            title: reportingPost.text.substring(0, 50) + (reportingPost.text.length > 50 ? '...' : ''),
            author: reportingPost.societies?.name
          }}
        />
      )}
    </div>
  )
}