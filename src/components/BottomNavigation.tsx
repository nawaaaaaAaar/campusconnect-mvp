import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Home, Users, Search, Bell, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  unreadCount?: number
}

export function BottomNavigation({ activeTab, onTabChange, unreadCount }: BottomNavigationProps) {
  const { profile } = useAuth()

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'societies', 
      label: 'Discover',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badge: unreadCount
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 h-16 rounded-none relative ${
                isActive ? `${item.bgColor} ${item.color}` : 'text-gray-500'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? item.color : 'text-gray-400'}`} />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                isActive ? item.color : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}