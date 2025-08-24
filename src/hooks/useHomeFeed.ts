import { useState, useEffect, useCallback } from 'react'
import { campusAPI, type HomeFeedResponse, type Post } from '../lib/api'
import { toast } from 'sonner'

export function useHomeFeed() {
  const [feedData, setFeedData] = useState<HomeFeedResponse | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async (isRefresh = false, loadMore = false) => {
    const currentCursor = loadMore ? cursor : null
    
    if (loadMore) {
      setLoadingMore(true)
    } else if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    setError(null)

    try {
      const response = await campusAPI.getHomeFeed({
        limit: 20,
        cursor: currentCursor || undefined
      })
      
      setFeedData(response)
      
      if (loadMore) {
        setPosts(prev => [...prev, ...response.data])
      } else {
        setPosts(response.data)
      }
      
      setCursor(response.cursor)
      setHasMore(!!response.cursor)
      
      // Show feed nudges if present
      if (response.feed_nudge && !loadMore) {
        console.log('Feed nudge:', response.feed_nudge)
      }
      
    } catch (err: any) {
      console.error('Failed to load home feed:', err)
      setError(err.message || 'Failed to load feed')
      
      if (!loadMore && !isRefresh) {
        toast.error('Failed to load home feed')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [cursor])

  const refreshFeed = useCallback(() => {
    setCursor(null)
    setHasMore(true)
    loadFeed(true, false)
  }, [loadFeed])

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadFeed(false, true)
    }
  }, [loadFeed, loadingMore, hasMore])

  // Initial load
  useEffect(() => {
    loadFeed()
  }, [])

  return {
    posts,
    feedData,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refreshFeed,
    loadMorePosts,
    reload: () => loadFeed()
  }
}