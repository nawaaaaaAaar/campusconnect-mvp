import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, X, Plus } from 'lucide-react'
import { createOrUpdateProfile } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function ProfileSetup() {
  const [searchParams] = useSearchParams()
  const accountTypeFromUrl = searchParams.get('accountType') as 'student' | 'society' | null
  const storedAccountType = sessionStorage.getItem('selectedAccountType') as 'student' | 'society' | null
  
  const accountType = accountTypeFromUrl || storedAccountType || 'student'
  
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
  
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

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
        name: name.trim(),
        institute: institute.trim(),
        course: accountType === 'student' ? (course || undefined) : undefined,
        bio: bio.trim() || undefined,
        account_type: accountType,
        // Society-specific fields
        society_name: accountType === 'society' ? societyName.trim() : undefined,
        society_category: accountType === 'society' ? (societyCategory || undefined) : undefined,
        society_description: accountType === 'society' ? (societyDescription.trim() || undefined) : undefined
      }
      
      await createOrUpdateProfile(profileData)
      
      // Clear stored account type after successful profile creation
      sessionStorage.removeItem('selectedAccountType')
      
      await refreshProfile()
      toast.success(`${accountType === 'society' ? 'Society' : 'Student'} profile created successfully!`)
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Profile setup error:', error)
      toast.error(error.message || 'Failed to create profile')
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Institution *</label>
                <Input
                  type="text"
                  placeholder="Your university or college"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Society-specific fields */}
            {accountType === 'society' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Society Name *</label>
                  <Input
                    type="text"
                    placeholder="Your society name"
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Society Category</label>
                  <select 
                    value={societyCategory} 
                    onChange={(e) => setSocietyCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {societyCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Society Description</label>
                  <Textarea
                    placeholder="Describe your society's mission and activities"
                    value={societyDescription}
                    onChange={(e) => setSocietyDescription(e.target.value)}
                    className="w-full min-h-[80px] resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {societyDescription.length}/500 characters
                  </div>
                </div>
              </>
            )}

            {/* Student-specific course field */}
            {accountType === 'student' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Course/Field of Study</label>
                <select 
                  value={course} 
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Select your field of study</option>
                  {courseOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                placeholder="Tell us a bit about yourself (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full min-h-[80px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {bio.length}/500 characters
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Interests</label>
              
              {/* Current interests */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Common interests */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Popular interests:</div>
                <div className="flex flex-wrap gap-2">
                  {commonInterests
                    .filter(interest => !interests.includes(interest))
                    .slice(0, 12)
                    .map((interest) => (
                    <Badge 
                      key={interest} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => addInterest(interest)}
                    >
                      <Plus size={12} className="mr-1" />
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Add custom interest */}
              <div className="flex gap-2">
                <Input
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
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => addInterest(newInterest)}
                  disabled={!newInterest.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !name.trim() || !institute.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                `Complete ${accountType === 'society' ? 'Society' : 'Student'} Setup`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
