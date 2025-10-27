import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Loader2, X, Plus } from 'lucide-react'
import { createOrUpdateProfile } from '../../lib/supabase'
import { campusAPI } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function ProfileSetup() {
  const [searchParams] = useSearchParams()
  const accountTypeFromUrl = searchParams.get('accountType') as 'student' | 'society' | null
  const storedAccountType = sessionStorage.getItem('selectedAccountType') as 'student' | 'society' | null
  
  const accountType = accountTypeFromUrl || storedAccountType || 'student'
  
  // Set page title for accessibility
  useEffect(() => {
    document.title = `Complete ${accountType === 'society' ? 'Society' : 'Student'} Profile Setup | CampusConnect`
  }, [accountType])
  
  const [name, setName] = useState('')
  const [institute, setInstitute] = useState('')
  const [course, setCourse] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  
  // Society-specific fields
  const [societyName, setSocietyName] = useState('')
  const [societyCategory, setSocietyCategory] = useState('')
  const [societyDescription, setSocietyDescription] = useState('')
  
  // Institutes data
  const [institutes, setInstitutes] = useState<Array<{ id: string; name: string; short_name: string }>>([])
  const [loadingInstitutes, setLoadingInstitutes] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  
  // Fetch institutes on mount
  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const response = await campusAPI.getInstitutes({ limit: 100 })
        if (response.data) {
          setInstitutes(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch institutes:', error)
        toast.error('Failed to load institutes')
      } finally {
        setLoadingInstitutes(false)
      }
    }
    
    fetchInstitutes()
  }, [])

  const courseOptions = ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts', 'Sciences', 'Other']
  
  const societyCategories = [
    'Academic', 'Cultural', 'Technical', 'Sports', 'Arts', 'Social Service', 
    'Business', 'Science', 'Literature', 'Music', 'Dance', 'Drama', 'Other'
  ]
  const commonInterests = [
    'Programming', 'AI/ML', 'Web Development', 'Data Science', 'Cybersecurity',
    'Sports', 'Music', 'Art', 'Photography', 'Gaming', 'Reading', 'Movies',
    'Travel', 'Cooking', 'Fitness', 'Volunteering', 'Entrepreneurship', 'Design'
  ]

  const addInterest = (interest: string) => {
    if (interest.trim() && !interests.includes(interest.trim())) {
      setInterests([...interests, interest.trim()])
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !institute.trim()) {
      toast.error('Please fill in your name and institution')
      return
    }
    
    if (accountType === 'society' && !societyName.trim()) {
      toast.error('Please enter your society name')
      return
    }

    setLoading(true)
    try {
      const profileData = {
        name: accountType === 'society' ? societyName.trim() : name.trim(),
        institute: institute.trim(),
        course: accountType === 'student' ? (course || undefined) : undefined,
        bio: accountType === 'society' ? societyDescription.trim() || undefined : bio.trim() || undefined,
        society_category: accountType === 'society' ? (societyCategory || 'Other') : undefined,
        account_type: accountType
      }
      
      await createOrUpdateProfile(profileData)
      
      // Clear stored account type after successful profile creation
      sessionStorage.removeItem('selectedAccountType')
      
      await refreshProfile()
      toast.success(`${accountType === 'society' ? 'Society' : 'Student'} profile created successfully!`)
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Profile setup error:', error)
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to create profile'
      
      if (error.message) {
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          errorMessage = 'Profile already exists. Please try refreshing the page and signing in again.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
          errorMessage = 'Authentication error. Please sign in again.'
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          errorMessage = 'Please check your information and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">CC</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            Complete Your {accountType === 'society' ? 'Society' : 'Student'} Profile
          </CardTitle>
          <CardDescription>
            {accountType === 'society' 
              ? "Set up your society profile to start engaging with students and sharing updates"
              : "Let's set up your profile to help you connect with your campus community"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <main role="main" aria-label="Profile Setup Form">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="full-name" className="text-sm font-medium">Full Name *</label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    aria-label="Full Name"
                    aria-describedby="full-name-description"
                    className="w-full"
                  />
                  <span id="full-name-description" className="sr-only">Enter your full legal name</span>
                </div>
                <div className="space-y-2">
                  <label htmlFor="institution-select" className="text-sm font-medium">Institution *</label>
                  <Select
                    value={institute}
                    onValueChange={setInstitute}
                    disabled={loadingInstitutes}
                  >
                    <SelectTrigger 
                      id="institution-select"
                      className="w-full"
                      aria-label="Institution Selection"
                      aria-describedby="institution-description"
                    >
                      <SelectValue placeholder={loadingInstitutes ? "Loading institutes..." : "Select your IIT"} />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.map((inst) => (
                        <SelectItem key={inst.id} value={inst.short_name}>
                          {inst.short_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span id="institution-description" className="sr-only">Select your educational institution</span>
                </div>
              </div>

              {/* Society-specific fields */}
              {accountType === 'society' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="society-name" className="text-sm font-medium">Society Name *</label>
                    <Input
                      id="society-name"
                      type="text"
                      placeholder="Your society name"
                      value={societyName}
                      onChange={(e) => setSocietyName(e.target.value)}
                      required
                      aria-label="Society Name"
                      aria-describedby="society-name-description"
                      className="w-full"
                    />
                    <span id="society-name-description" className="sr-only">Enter your society's official name</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="society-category" className="text-sm font-medium">Society Category</label>
                    <select 
                      id="society-category"
                      value={societyCategory} 
                      onChange={(e) => setSocietyCategory(e.target.value)}
                      aria-label="Society Category"
                      aria-describedby="society-category-description"
                      className="w-full px-3 py-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-11"
                    >
                      <option value="">Select category</option>
                      {societyCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <span id="society-category-description" className="sr-only">Choose the category that best describes your society</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="society-description" className="text-sm font-medium">Society Description</label>
                    <Textarea
                      id="society-description"
                      placeholder="Describe your society's mission and activities"
                      value={societyDescription}
                      onChange={(e) => setSocietyDescription(e.target.value)}
                      aria-label="Society Description"
                      aria-describedby="society-description-help"
                      className="w-full min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <div id="society-description-help" className="text-xs text-muted-foreground text-right">
                      {societyDescription.length}/500 characters
                    </div>
                  </div>
                </>
              )}

              {/* Student-specific course field */}
              {accountType === 'student' && (
                <div className="space-y-2">
                  <label htmlFor="course-field" className="text-sm font-medium">Course/Field of Study</label>
                  <select 
                    id="course-field"
                    value={course} 
                    onChange={(e) => setCourse(e.target.value)}
                    aria-label="Course or Field of Study"
                    aria-describedby="course-field-description"
                    className="w-full px-3 py-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-11"
                  >
                    <option value="">Select your field of study</option>
                    {courseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <span id="course-field-description" className="sr-only">Select your academic field or course of study</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="bio-textarea" className="text-sm font-medium">Bio</label>
                <Textarea
                  id="bio-textarea"
                  placeholder={accountType === 'society' ? "Tell us about your society's mission and activities (optional)" : "Tell us a bit about yourself (optional)"}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  aria-label="Bio"
                  aria-describedby="bio-description"
                  className="w-full min-h-[80px] resize-none"
                  maxLength={500}
                />
                <div id="bio-description" className="text-xs text-muted-foreground text-right">
                  {bio.length}/500 characters
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Interests</label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Selected interests">
                    {interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1" role="listitem">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          aria-label={`Remove ${interest} from interests`}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Popular interests:</p>
                    <div className="flex flex-wrap gap-2" role="list" aria-label="Popular interests">
                      {commonInterests.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => addInterest(interest)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80"
                          aria-label={`Add ${interest} to interests`}
                        >
                          {interest}
                          <Plus size={12} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input
                      id="custom-interest"
                      type="text"
                      placeholder="Add a custom interest"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addInterest(newInterest)
                        }
                      }}
                      aria-label="Custom Interest"
                      aria-describedby="custom-interest-description"
                      className="w-full"
                    />
                    <span id="custom-interest-description" className="sr-only">Enter a custom interest and press enter to add it</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || !institute.trim() || (accountType === 'society' && !societyName.trim())}
                  className="flex-1"
                  aria-describedby="submit-button-description"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {accountType === 'society' ? 'Creating Society...' : 'Creating Profile...'}
                    </>
                  ) : (
                    `Complete ${accountType === 'society' ? 'Society' : 'Student'} Setup`
                  )}
                </Button>
                <span id="submit-button-description" className="sr-only">
                  {accountType === 'society' ? 'Create your society profile' : 'Create your student profile'}
                </span>
              </div>
            </form>
          </main>
        </CardContent>
      </Card>
    </div>
  )
}
