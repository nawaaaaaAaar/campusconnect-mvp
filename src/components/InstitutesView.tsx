import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Loader2, Building2, Users, MapPin, Search, Star } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { toast } from 'sonner'

interface Institute {
  id: string
  name: string
  short_name?: string
  location?: string
  verified?: boolean
  societies_count?: number
}

interface InstitutesViewProps {
  onInstituteSelect?: (institute: Institute) => void
}

export function InstitutesView({ onInstituteSelect }: InstitutesViewProps) {
  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [filteredInstitutes, setFilteredInstitutes] = useState<Institute[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInstitutes()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInstitutes(institutes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = institutes.filter(
        (institute) =>
          institute.name.toLowerCase().includes(query) ||
          institute.short_name?.toLowerCase().includes(query) ||
          institute.location?.toLowerCase().includes(query)
      )
      setFilteredInstitutes(filtered)
    }
  }, [searchQuery, institutes])

  const loadInstitutes = async () => {
    setLoading(true)
    try {
      // PRD 3.3: Fetch institutes from API
      const response = await campusAPI.getInstitutes()
      setInstitutes(response.data || [])
      setFilteredInstitutes(response.data || [])
    } catch (error: any) {
      console.error('Institutes load error:', error)
      toast.error('Failed to load institutes')
    } finally {
      setLoading(false)
    }
  }

  const handleInstituteClick = (institute: Institute) => {
    if (onInstituteSelect) {
      onInstituteSelect(institute)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading institutes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Building2 className="h-6 w-6 mr-2" />
          Institutes
        </h2>
      </div>

      <p className="text-gray-600">
        Discover societies from different educational institutions.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search institutes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Institutes List */}
      <div className="space-y-3">
        {filteredInstitutes.map((institute) => (
          <Card
            key={institute.id}
            className="hover:shadow-lg transition-all cursor-pointer"
            onClick={() => handleInstituteClick(institute)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {institute.name}
                      </h3>
                      {institute.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {institute.short_name && (
                      <p className="text-sm text-gray-600">{institute.short_name}</p>
                    )}
                    {institute.location && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{institute.location}</span>
                      </div>
                    )}
                    {institute.societies_count !== undefined && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{institute.societies_count} societies</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInstitutes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No institutes found for "{searchQuery}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No institutes available</p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}



