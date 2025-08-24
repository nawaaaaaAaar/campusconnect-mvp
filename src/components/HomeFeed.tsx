import React, { useState } from 'react'
import { useHomeFeed } from '../hooks/useHomeFeed'
import { campusAPI, type Post } from '../lib/api'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Separator } from '../components/ui/separator'
import { Heart, MessageCircle, Share, RefreshCw, TrendingUp, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: Post
  onLike: (postId: string, liked: boolean) => void
}

function PostCard({ post, onLike }: PostCardProps) {
  const [liking, setLiking] = useState(false)

  const handleLike = async () => {
    if (liking) return
    
    setLiking(true)
    try {
      if (post.has_liked) {
        await campusAPI.unlikePost(post.id)
        onLike(post.id, false)
      } else {
        await campusAPI.likePost(post.id)
        onLike(post.id, true)
      }
    } catch (error) {
      toast.error('Failed to update like status')
    } finally {
      setLiking(false)
    }
  }

  const getFeedSourceIcon = () => {
    if (post.feed_source === 'followed') {
      return <Users className="h-3 w-3 text-blue-500" />
    }
    return <TrendingUp className="h-3 w-3 text-purple-500" />
  }

  const getFeedSourceLabel = () => {
    if (post.feed_source === 'followed') {
      return 'Following'
    }
    return 'Discover'
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.society_id.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">Society Name</p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
            {getFeedSourceIcon()}
            <span className="text-xs font-medium text-gray-600">{getFeedSourceLabel()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {post.text && (
          <p className="text-gray-900 mb-4 leading-relaxed">{post.text}</p>
        )}
        
        {post.media_url && (
          <div className="mb-4">
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="w-full rounded-lg object-cover max-h-96"
            />
          </div>
        )}
        
        {post.link_url && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <a 
              href={post.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {post.link_url}
            </a>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              disabled={liking}
              className={`${post.has_liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            >
              {liking ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 mr-1 ${post.has_liked ? 'fill-current' : ''}`} />
              )}
              {post.likes_count || 0}
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.comments_count || 0}
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeedNudgeProps {
  nudge: {
    type: string
    title: string
    message: string
    action: string
  }
}

function FeedNudge({ nudge }: FeedNudgeProps) {
  return (
    <Card className="w-full border-2 border-dashed border-blue-200 bg-blue-50">
      <CardContent className="text-center py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              {nudge.type === 'no_follows' ? (
                <Users className="h-6 w-6 text-blue-600" />
              ) : (
                <TrendingUp className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{nudge.title}</h3>
          <p className="text-gray-600 mb-4">{nudge.message}</p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            {nudge.action === 'explore_societies' ? 'Explore Societies' : 'Discover More'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function HomeFeed() {
  const { 
    posts, 
    feedData, 
    loading, 
    refreshing, 
    loadingMore, 
    hasMore, 
    error, 
    refreshFeed, 
    loadMorePosts 
  } = useHomeFeed()

  const handlePostLike = (postId: string, liked: boolean) => {
    // Update local post state
    // This would ideally be handled by a state management solution
    console.log(`Post ${postId} ${liked ? 'liked' : 'unliked'}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized feed...</p>
          <p className="text-sm text-gray-500 mt-1">Applying 2F:1G algorithm</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load feed: {error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Feed Stats & Controls */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{feedData?.meta.followed_posts || 0}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{feedData?.meta.global_posts || 0}</p>
            <p className="text-xs text-gray-500">Discover</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {feedData?.meta.followed_societies_count || 0} Societies
            </p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshFeed}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Feed Nudge */}
      {feedData?.feed_nudge && (
        <FeedNudge nudge={feedData.feed_nudge} />
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={handlePostLike}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-6">
          <Button 
            variant="outline" 
            onClick={loadMorePosts}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more posts...
              </>
            ) : (
              'Load More Posts'
            )}
          </Button>
        </div>
      )}

      {/* Algorithm Attribution */}
      <div className="text-center py-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Powered by CampusConnect's 2F:1G Algorithm
        </p>
        {feedData?.meta.ratio_achieved && (
          <p className="text-xs text-gray-400 mt-1">
            {Math.round(feedData.meta.ratio_achieved.followed * 100)}% Following • {Math.round(feedData.meta.ratio_achieved.global * 100)}% Discover
          </p>
        )}
      </div>
    </div>
  )
}