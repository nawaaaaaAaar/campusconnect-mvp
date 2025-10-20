import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { SocietyProfile } from '../components/SocietyProfile'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function SocietyProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [initialTab, setInitialTab] = useState('posts')

  useEffect(() => {
    // PRD 4: Read tab query parameter
    const tab = searchParams.get('tab')
    if (tab && ['posts', 'about', 'members'].includes(tab)) {
      setInitialTab(tab)
    }
  }, [searchParams])

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Society not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <h1 className="ml-4 text-lg font-semibold">Society Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <SocietyProfile societyId={id} onBack={() => navigate('/dashboard')} />
      </main>
    </div>
  )
}

