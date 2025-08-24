import React, { useState } from 'react'
import { useSocieties } from '../hooks/useSocieties'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Search, Users, CheckCircle, UserPlus, UserMinus, Loader2, Heart, MessageCircle } from 'lucide-react'
import { type Society } from '../lib/api'

interface SocietyCardProps {
  society: Society
  onFollow: (societyId: string) => void
  onUnfollow: (societyId: string) => void
}

function SocietyCard({ society, onFollow, onUnfollow }: SocietyCardProps) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleFollowAction = async () => {
    if (actionLoading) return
    
    setActionLoading(true)
    try {
      if (society.is_following) {
        await onUnfollow(society.id)
      } else {
        await onFollow(society.id)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const followersCount = society.society_followers?.[0]?.count || 0
  const membersCount = society.society_members?.[0]?.count || 0
  const postsCount = society.posts?.[0]?.count || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {society.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{society.name}</CardTitle>
                {society.verified && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
              {society.category && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {society.category}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant={society.is_following ? "outline" : "default"}
            size="sm"
            onClick={handleFollowAction}
            disabled={actionLoading}
            className={society.is_following ? 
              "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400" : 
              "bg-blue-600 hover:bg-blue-700"
            }
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
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600">
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
    </Card>
  )
}

interface SocietiesSearchProps {
  onSearch: (query: string) => void
  searchQuery: string
}

function SocietiesSearch({ onSearch, searchQuery }: SocietiesSearchProps) {
  const [query, setQuery] = useState(searchQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search societies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SocietiesDiscovery() {
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
    searchSocieties
  } = useSocieties()

  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    searchSocieties(query)
  }

  if (loading) {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Discover Campus Societies
        </h1>
        <p className="text-gray-600">
          Find and follow societies that match your interests
        </p>
      </div>

      {/* Search */}
      <SocietiesSearch onSearch={handleSearch} searchQuery={searchQuery} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-blue-600">{societies.length}</p>
            <p className="text-sm text-gray-600">Societies Found</p>
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
      </div>

      {/* Societies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {societies.map((society) => (
          <SocietyCard
            key={society.id}
            society={society}
            onFollow={followSociety}
            onUnfollow={unfollowSociety}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-6">
          <Button
            variant="outline"
            onClick={loadMoreSocieties}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more societies...
              </>
            ) : (
              'Load More Societies'
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {societies.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No societies found' : 'No societies available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 
                `No societies match "${searchQuery}". Try a different search term.` :
                'There are no societies available at the moment.'
              }
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => handleSearch('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}