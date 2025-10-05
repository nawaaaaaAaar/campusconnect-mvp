import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Search, Filter, X, Users, Building, Star, TrendingUp } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { toast } from 'sonner'

interface SearchAndDiscoveryProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

interface Society {
  id: string
  name: string
  institute_id: string
  category?: string
  description?: string
  verified: boolean
  society_followers?: { count: number }[]
  society_members?: { count: number }[]
  is_following?: boolean
}

const CATEGORIES = [
  'Technology', 'Sports', 'Arts', 'Music', 'Academic', 'Social', 
  'Cultural', 'Business', 'Health', 'Environment', 'Volunteer'
]

const INSTITUTES = [
  'MIT', 'Stanford', 'Harvard', 'Berkeley', 'Caltech', 
  'CMU', 'Other'
]

export function SearchAndDiscovery({ searchQuery, onSearchChange }: SearchAndDiscoveryProps) {
  const [query, setQuery] = useState(searchQuery || '')
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedInstitute, setSelectedInstitute] = useState<string>('')
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        limit: 20
      }
      
      if (query.trim()) {
        params.search = query.trim()
      }
      
      if (selectedCategory) {
        params.category = selectedCategory
      }
      
      if (selectedInstitute) {
        params.institute = selectedInstitute
      }
      
      if (showVerifiedOnly) {
        params.verified = true
      }
      
      const response = await campusAPI.getSocieties(params)
      setSocieties(response.data || [])
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error('Failed to search societies')
    } finally {
      setLoading(false)
    }
  }, [query, selectedCategory, selectedInstitute, showVerifiedOnly])

  const loadFeaturedSocieties = useCallback(async () => {
    setLoading(true)
    try {
      const response = await campusAPI.getSocieties({
        limit: 20,
        verified: true
      })
      setSocieties(response.data || [])
    } catch (error: any) {
      console.error('Featured societies error:', error)
      setSocieties([])
    } finally {
      setLoading(false)
    }
  }, [])

  // PRD Section 5.2: Typeahead search ≤500ms
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    
    searchTimerRef.current = setTimeout(() => {
      if (query.trim() || selectedCategory || selectedInstitute) {
        performSearch()
      } else {
        loadFeaturedSocieties()
      }
    }, 300)
    
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [query, selectedCategory, selectedInstitute, showVerifiedOnly, performSearch, loadFeaturedSocieties])

  const handleSearchChange = (value: string) => {
    setQuery(value)
    onSearchChange?.(value)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedInstitute('')
    setShowVerifiedOnly(false)
    setQuery('')
    onSearchChange?.('')
  }

  const handleFollowToggle = async (society: Society) => {
    try {
      if (society.is_following) {
        await campusAPI.unfollowSociety(society.id)
        toast.success(`Unfollowed ${society.name}`)
      } else {
        await campusAPI.followSociety(society.id)
        toast.success(`Now following ${society.name}`)
      }
      
      // Update the society in the list
      setSocieties(prev => prev.map(s => 
        s.id === society.id 
          ? { ...s, is_following: !s.is_following }
          : s
      ))
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow status')
    }
  }

  if (selectedSociety) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedSociety(null)}
          className="mb-4"
        >
          ← Back to Discovery
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                  {selectedSociety.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedSociety.name}</h1>
                  {selectedSociety.verified && (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{selectedSociety.institute_id}</p>
                {selectedSociety.category && (
                  <Badge variant="outline" className="mb-3">
                    {selectedSociety.category}
                  </Badge>
                )}
                <p className="text-gray-700 mb-4">
                  {selectedSociety.description || 'No description available'}
                </p>
                <div className="flex items-center space-x-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedSociety.society_members?.[0]?.count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedSociety.society_followers?.[0]?.count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant={selectedSociety.is_following ? "outline" : "default"}
                  onClick={() => handleFollowToggle(selectedSociety)}
                  className="w-full"
                >
                  {selectedSociety.is_following ? 'Following' : 'Follow Society'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-green-600" />
            <span>Discover Societies</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search societies by name or description..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {/* Institute Filter */}
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Institutes</option>
              {INSTITUTES.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            
            {/* Verified Filter */}
            <Button
              variant={showVerifiedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
              className="flex items-center space-x-1"
            >
              <Star className="h-3 w-3" />
              <span>Verified</span>
            </Button>
            
            {/* Clear Filters */}
            {(selectedCategory || selectedInstitute || showVerifiedOnly || query) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-2 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded mb-4 w-4/5"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : societies.length > 0 ? (
          societies.map((society) => (
            <Card key={society.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1" onClick={() => setSelectedSociety(society)}>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {society.name}
                      </h3>
                      {society.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{society.institute_id}</p>
                    {society.category && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {society.category}
                      </Badge>
                    )}
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {society.description || 'No description available'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{society.society_members?.[0]?.count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{society.society_followers?.[0]?.count || 0}</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={society.is_following ? "outline" : "default"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFollowToggle(society)
                    }}
                  >
                    {society.is_following ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {query || selectedCategory || selectedInstitute 
                ? 'No societies found' 
                : 'Start your discovery'}
            </h3>
            <p className="text-gray-600">
              {query || selectedCategory || selectedInstitute
                ? 'Try adjusting your search criteria or filters'
                : 'Search for societies or use filters to discover communities'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}