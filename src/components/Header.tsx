import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { SearchBar } from './SearchBar'
import { Search, Bell, Plus, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  onCreatePost: () => void
  onNotificationClick: () => void
  onSignOut: () => void
  unreadCount?: number
  onSearch?: (query: string) => void
  searchQuery?: string
}

export function Header({ 
  onCreatePost, 
  onNotificationClick, 
  onSignOut, 
  unreadCount, 
  onSearch,
  searchQuery 
}: HeaderProps) {
  const { user, profile } = useAuth()
  const [searchValue, setSearchValue] = useState(searchQuery || '')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchValue)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900 hidden sm:block">CampusConnect</h1>
          </div>
          
          {/* Search Bar - PRD Section 5.2 */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            {onSearch ? (
              <SearchBar 
                onSearch={onSearch}
                placeholder="Search societies, posts, or topics..."
                showSuggestions={true}
              />
            ) : (
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search societies, posts, or topics..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10 pr-4 w-full"
                />
              </form>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Create Post - Only for societies */}
            {profile?.account_type === 'society' && (
              <Button 
                onClick={onCreatePost}
                className="bg-green-600 hover:bg-green-700 hidden sm:flex"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            )}

            {/* Notifications Bell - PRD Section 5.6 */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={onNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {profile?.account_type || 'Student'}
                  </p>
                </div>
              </Button>
              
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs capitalize">
                      {profile?.account_type || 'Student'} Account
                    </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowUserMenu(false)
                      // Navigate to profile settings
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowUserMenu(false)
                      onSignOut()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search societies, posts, topics..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-4 w-full"
            />
          </form>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}