import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, TrendingUp, Users, Hash } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'society' | 'post' | 'user' | 'hashtag'
  title: string
  subtitle?: string
  avatar?: string
  metadata?: Record<string, any>
}

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search societies, posts, or topics...", 
  className = "",
  showSuggestions = true 
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trending, setTrending] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches and trending topics
  useEffect(() => {
    const saved = localStorage.getItem('campusconnect_recent_searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch {
        localStorage.removeItem('campusconnect_recent_searches')
      }
    }
    
    // Mock trending topics (in real app, this would come from analytics)
    setTrending([
      'campus events', 'study groups', 'computer science', 'arts society',
      'sports club', 'tech meetup', 'campus news', 'student council'
    ])
  }, [])

  // Handle search suggestions
  useEffect(() => {
    if (!query.trim() || !showSuggestions) {
      setSuggestions([])
      return
    }

    const searchSuggestions: SearchResult[] = []
    const queryLower = query.toLowerCase()

    // Search in recent searches
    recentSearches
      .filter(search => search.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach(search => {
        searchSuggestions.push({
          id: `recent-${search}`,
          type: 'user',
          title: search,
          subtitle: 'Recent search',
          metadata: { isRecent: true }
        })
      })

    // Search in trending
    trending
      .filter(topic => topic.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach(topic => {
        searchSuggestions.push({
          id: `trending-${topic}`,
          type: 'hashtag',
          title: topic,
          subtitle: 'Trending topic',
          metadata: { isTrending: true }
        })
      })

    // Simulate society search
    if (query.length >= 2) {
      setIsLoading(true)
      const timeout = setTimeout(() => {
        const mockSocieties = ['Computer Science Society', 'Arts & Culture Club', 'Sports Society', 'Debate Club']
        mockSocieties
          .filter(society => society.toLowerCase().includes(queryLower))
          .slice(0, 2)
          .forEach(society => {
            searchSuggestions.push({
              id: `society-${society}`,
              type: 'society',
              title: society,
              subtitle: `${Math.floor(Math.random() * 500)} members`,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(society)}&background=random`
            })
          })
        setIsLoading(false)
      }, 300)
      
      return () => clearTimeout(timeout)
    }

    setSuggestions(searchSuggestions)
    setSelectedIndex(-1)
  }, [query, showSuggestions, recentSearches, trending])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex])
        } else {
          performSearch(query)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Add to recent searches
    const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updatedRecent)
    localStorage.setItem('campusconnect_recent_searches', JSON.stringify(updatedRecent))

    setShowDropdown(false)
    onSearch(searchQuery)
    inputRef.current?.blur()
  }

  const selectSuggestion = (suggestion: SearchResult) => {
    setQuery(suggestion.title)
    performSearch(suggestion.title)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('campusconnect_recent_searches')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            // Delay hiding to allow for suggestion clicks
            setTimeout(() => setShowDropdown(false), 200)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showDropdown && (query || recentSearches.length > 0 || trending.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-3 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2">Searching...</span>
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">SUGGESTIONS</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {suggestion.type === 'user' && <Clock className="h-4 w-4 text-gray-400" />}
                    {suggestion.type === 'hashtag' && <Hash className="h-4 w-4 text-blue-500" />}
                    {suggestion.type === 'society' && <Users className="h-4 w-4 text-green-500" />}
                    {suggestion.type === 'post' && <Search className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-gray-500 truncate">{suggestion.subtitle}</div>
                    )}
                  </div>
                  {suggestion.metadata?.isRecent && (
                    <span className="text-xs text-blue-600">Recent</span>
                  )}
                  {suggestion.metadata?.isTrending && (
                    <span className="text-xs text-orange-600">Trending</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="text-xs font-medium text-gray-500">RECENT SEARCHES</div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => performSearch(search)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 text-sm text-gray-700 truncate">{search}</div>
                </button>
              ))}
            </div>
          )}

          {/* Trending Topics */}
          {!query && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">TRENDING</div>
              {trending.slice(0, 6).map((topic, index) => (
                <button
                  key={`trending-${index}`}
                  onClick={() => performSearch(topic)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <div className="flex-1 text-sm text-gray-700 truncate">{topic}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
