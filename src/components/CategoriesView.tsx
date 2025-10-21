import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Loader2, Grid, Users } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  display_order?: number
  societies_count?: number
}

interface CategoriesViewProps {
  onCategorySelect?: (category: Category) => void
}

export function CategoriesView({ onCategorySelect }: CategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      // PRD 3.3: Fetch categories from API
      const response = await campusAPI.getCategories()
      setCategories(response.data || [])
    } catch (error: any) {
      console.error('Categories load error:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Grid className="h-6 w-6 mr-2" />
          Categories
        </h2>
      </div>

      <p className="text-gray-600">
        Explore societies by category to find communities that match your interests.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleCategoryClick(category)}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-3">
                {category.icon ? (
                  <div className="text-4xl">{category.icon}</div>
                ) : (
                  <Grid className="h-12 w-12 mx-auto text-gray-400 group-hover:text-blue-600 transition-colors" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
              {category.societies_count !== undefined && (
                <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{category.societies_count} societies</span>
                </div>
              )}
              {category.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {category.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Grid className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No categories available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



