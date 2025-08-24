import React, { useState, useCallback, useEffect } from 'react'
import { useSocieties } from '../hooks/useSocieties'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Search, Users, CheckCircle, UserPlus, UserMinus, Loader2, Heart, MessageCircle, Filter, X, Building, Tag, Verified } from 'lucide-react'
import { type Society } from '../lib/api'
import { toast } from 'sonner'
import { SocietyProfile } from './SocietyProfile'

interface SearchFilters {
  category?: string
  institute?: string
  verified?: boolean
}

export function EnhancedSocietiesDiscovery() {
  const {
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
    searchSocieties,
    filterSocieties
  } = useSocieties()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSociety, setSelectedSociety] = useState<string | null>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableInstitutes, setAvailableInstitutes] = useState<string[]>([])

  // Extract unique categories and institutes from societies for filtering
  useEffect(() => {
    const categories = [...new Set(societies.map(s => s.category).filter(Boolean))]
    const institutes = [...new Set(societies.map(s => s.institute_id).filter(Boolean))]
    setAvailableCategories(categories)
    setAvailableInstitutes(institutes)
  }, [societies])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      if (query.trim()) {
        searchSocieties(query.trim())
      } else {
        // If query is empty, apply current filters or show all
        if (Object.keys(filters).length > 0) {
          filterSocieties(filters)
        } else {
          refreshSocieties()
        }
      }
    }, 300)
    
    setSearchTimeout(newTimeout)
  }, [searchTimeout, searchSocieties, filterSocieties, refreshSocieties, filters])

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    
    // Apply filters
    if (searchQuery.trim()) {
      // If there's a search query, combine search with filters
      searchSocieties(searchQuery.trim())
    } else {
      filterSocieties(newFilters)
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    refreshSocieties()
  }

  const handleFollowAction = async (society: Society) => {
    try {
      if (society.is_following) {
        await unfollowSociety(society.id)
      } else {
        await followSociety(society.id)
      }
    } catch (error) {
      // Error handling is already done in the hook
    }
  }

  // Show society profile if selected
  if (selectedSociety) {
    return (
      <SocietyProfile 
        societyId={selectedSociety} 
        onBack={() => setSelectedSociety(null)}
      />
    )
  }

  if (loading && societies.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Discovering societies...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load societies: {error}</p>
        <Button onClick={refreshSocieties}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Discover Campus Societies
        </h1>
        <p className="text-gray-600">
          Find and connect with societies that match your interests
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search societies by name, category, or description..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => handleSearchChange('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {Object.keys(filters).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
              
              {(searchQuery || Object.keys(filters).length > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange({ ...filters, category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Institute Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="h-4 w-4 inline mr-1" />
                    Institute
                  </label>
                  <select
                    value={filters.institute || ''}
                    onChange={(e) => handleFilterChange({ ...filters, institute: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Institutes</option>
                    {availableInstitutes.map((institute) => (
                      <option key={institute} value={institute}>
                        {institute}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Verified className="h-4 w-4 inline mr-1" />
                    Verification
                  </label>
                  <select
                    value={filters.verified === undefined ? '' : filters.verified.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      handleFilterChange({ 
                        ...filters, 
                        verified: value === '' ? undefined : value === 'true'
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Societies</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-blue-600">{societies.length}</p>
            <p className="text-sm text-gray-600">
              {searchQuery || Object.keys(filters).length > 0 ? 'Found' : 'Total'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">
              {societies.filter(s => s.is_following).length}
            </p>
            <p className="text-sm text-gray-600">Following</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-purple-600">
              {societies.filter(s => s.verified).length}
            </p>
            <p className="text-sm text-gray-600">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-orange-600">
              {availableCategories.length}
            </p>
            <p className="text-sm text-gray-600">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Societies Grid */}
      {societies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {societies.map((society) => (
            <SocietyCard
              key={society.id}
              society={society}
              onFollow={() => handleFollowAction(society)}
              onViewProfile={() => setSelectedSociety(society.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || Object.keys(filters).length > 0 ? 'No societies found' : 'No societies available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || Object.keys(filters).length > 0 ? 
                'Try adjusting your search or filters to find more societies.' :
                'There are no societies available at the moment.'
              }
            </p>
            {(searchQuery || Object.keys(filters).length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Search & Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {hasMore && societies.length > 0 && (
        <div className="text-center py-6">
          <Button
            variant="outline"
            onClick={loadMoreSocieties}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More Societies'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Society Card Component
interface SocietyCardProps {
  society: Society
  onFollow: () => void
  onViewProfile: () => void
}

function SocietyCard({ society, onFollow, onViewProfile }: SocietyCardProps) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleFollowAction = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await onFollow()
    } finally {
      setActionLoading(false)
    }
  }

  const followersCount = society.society_followers?.[0]?.count || 0
  const membersCount = society.society_members?.[0]?.count || 0
  const postsCount = society.posts?.[0]?.count || 0

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={onViewProfile}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {society.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors truncate">
                    {society.name}
                  </CardTitle>
                  {society.verified && (
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                {society.category && (
                  <Badge variant="secondary" className="text-xs">
                    {society.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {society.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
              {society.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
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
        </CardContent>
      </div>
      
      <CardContent className="pt-0">
        <Button
          variant={society.is_following ? "outline" : "default"}
          size="sm"
          onClick={handleFollowAction}
          disabled={actionLoading}
          className={`w-full ${
            society.is_following ? 
            "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400" : 
            "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : society.is_following ? (
            <UserMinus className="h-4 w-4 mr-1" />
          ) : (
            <UserPlus className="h-4 w-4 mr-1" />
          )}
          {society.is_following ? 'Unfollow' : 'Follow'}
        </Button>
      </CardContent>
    </Card>
  )
}