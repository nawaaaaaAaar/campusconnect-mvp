import { useState, useEffect, useCallback } from 'react'
import { campusAPI, type Society } from '../lib/api'
import { toast } from 'sonner'

export function useSocieties() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSocieties = useCallback(async (params?: {
    isRefresh?: boolean
    loadMore?: boolean
    search?: string
    category?: string
    institute?: string
    verified?: boolean
  }) => {
    const { isRefresh = false, loadMore = false, ...filterParams } = params || {}
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
      const response = await campusAPI.getSocieties({
        limit: 20,
        cursor: currentCursor || undefined,
        ...filterParams
      })
      
      if (loadMore) {
        setSocieties(prev => [...prev, ...response.data])
      } else {
        setSocieties(response.data)
      }
      
      setCursor(response.cursor)
      setHasMore(!!response.cursor)
      
    } catch (err: any) {
      console.error('Failed to load societies:', err)
      setError(err.message || 'Failed to load societies')
      
      if (!loadMore && !isRefresh) {
        toast.error('Failed to load societies')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [cursor])

  const refreshSocieties = useCallback(() => {
    setCursor(null)
    setHasMore(true)
    loadSocieties({ isRefresh: true })
  }, [loadSocieties])

  const loadMoreSocieties = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadSocieties({ loadMore: true })
    }
  }, [loadSocieties, loadingMore, hasMore])

  const followSociety = useCallback(async (societyId: string) => {
    try {
      await campusAPI.followSociety(societyId)
      
      // Update local state
      setSocieties(prev => prev.map(society => 
        society.id === societyId 
          ? { ...society, is_following: true }
          : society
      ))
      
      toast.success('Society followed successfully')
    } catch (err: any) {
      console.error('Failed to follow society:', err)
      toast.error('Failed to follow society')
    }
  }, [])

  const unfollowSociety = useCallback(async (societyId: string) => {
    try {
      await campusAPI.unfollowSociety(societyId)
      
      // Update local state
      setSocieties(prev => prev.map(society => 
        society.id === societyId 
          ? { ...society, is_following: false }
          : society
      ))
      
      toast.success('Society unfollowed successfully')
    } catch (err: any) {
      console.error('Failed to unfollow society:', err)
      toast.error('Failed to unfollow society')
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadSocieties()
  }, [])

  return {
    societies,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refreshSocieties,
    loadMoreSocieties,
    followSociety,
    unfollowSociety,
    searchSocieties: (search: string) => {
      setCursor(null)
      setHasMore(true)
      loadSocieties({ search })
    },
    filterSocieties: (filters: {
      category?: string
      institute?: string
      verified?: boolean
    }) => {
      setCursor(null)
      setHasMore(true)
      loadSocieties(filters)
    }
  }
}