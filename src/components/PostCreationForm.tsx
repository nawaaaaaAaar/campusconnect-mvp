import React, { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { campusAPI } from '../lib/api'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { X, Image, Video, Link, Calendar, Upload, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface PostCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface PostFormData {
  society_id: string
  type: 'text' | 'image' | 'video' | 'link' | 'event'
  text: string
  link_url?: string
  event_date?: string
  event_location?: string
}

export function PostCreationForm({ onSuccess, onCancel }: PostCreationFormProps) {
  const { profile } = useAuth()
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'link' | 'event'>('text')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [societies, setSocieties] = useState<any[]>([])
  const [loadingSocieties, setLoadingSocieties] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } = useForm<PostFormData>({
    defaultValues: {
      type: 'text',
      text: ''
    }
  })

  const loadUserSocieties = useCallback(async () => {
    if (loadingSocieties) return // Prevent double loading
    
    setLoadingSocieties(true)
    try {
      // Get user's profile with society memberships
      const response = await campusAPI.getProfile()
      console.log('Profile response:', response)
      
      // For society accounts, they can post as their own society
      if (profile?.account_type === 'society') {
        // If this is a society account, try to find their society
        const societies = await campusAPI.getSocieties({ limit: 1000 })
        const ownSociety = societies.data?.find((s: any) => s.owner_user_id === profile.id)
        
        if (ownSociety) {
          setSocieties([ownSociety])
          setValue('society_id', ownSociety.id)
          console.log('Found own society:', ownSociety)
        } else {
          console.log('Society account but no society found - will be created soon')
          toast.info('Setting up your society... Please refresh in a moment.')
          setSocieties([])
        }
      } else if (response?.data?.society_memberships) {
        // For student accounts, show societies they're members of
        const postingSocieties = response.data.society_memberships
        
        console.log('Posting societies:', postingSocieties)
        setSocieties(postingSocieties)
        
        if (postingSocieties.length === 0) {
          toast.error('You are not a member of any society. Join a society to create posts.')
        }
      } else {
        console.log('No society memberships found')
        setSocieties([])
      }
    } catch (error: any) {
      console.error('Failed to load societies:', error)
      setSocieties([])
      toast.error('Failed to load your societies. Please refresh and try again.')
    } finally {
      setLoadingSocieties(false)
    }
  }, [loadingSocieties, profile, setValue])

  // Load user's societies where they can post
  React.useEffect(() => {
    loadUserSocieties()
  }, [loadUserSocieties])

  // Check account type - only societies can create posts
  if (profile?.account_type !== 'society') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Post Creation Not Available
          </h3>
          <p className="text-gray-600 mb-4">
            Only society accounts can create posts. As a student, you can engage with posts by liking, commenting, and sharing to stay connected with campus communities.
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <p>✓ Like posts to show support</p>
            <p>✓ Comment to join conversations</p>
            <p>✓ Share interesting content</p>
            <p>✓ Follow societies you're interested in</p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Back to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/webm', 'video/mov']
    }

    const isImage = allowedTypes.image.includes(file.type)
    const isVideo = allowedTypes.video.includes(file.type)

    if (!isImage && !isVideo) {
      toast.error('Please select a valid image (JPEG, PNG, WebP, GIF) or video (MP4, WebM, MOV) file')
      return
    }

    // Validate file size
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${isVideo ? '50MB' : '10MB'}`)
      return
    }

    setMediaFile(file)
    setPostType(isVideo ? 'video' : 'image')
    setValue('type', isVideo ? 'video' : 'image')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadMediaFile = async (): Promise<string | null> => {
    if (!mediaFile) return null

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Convert file to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string

            // Simulate upload progress
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => {
                if (prev >= 90) {
                  clearInterval(progressInterval)
                  return prev
                }
                return prev + 10
              })
            }, 200)

            const { data, error } = await supabase.functions.invoke('media-upload-api', {
              body: {
                mediaData: base64Data,
                fileName: mediaFile.name,
                mediaType: mediaFile.type
              }
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (error) throw error

            resolve(data.data.publicUrl)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(mediaFile)
      })
    } catch (error: any) {
      console.error('Media upload error:', error)
      toast.error('Failed to upload media file')
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: PostFormData) => {
    if (!data.society_id) {
      toast.error('Please select a society to post to')
      return
    }

    try {
      let mediaUrl = null
      if (mediaFile && (postType === 'image' || postType === 'video')) {
        try {
          mediaUrl = await uploadMediaFile()
        } catch (uploadError) {
          console.error('Media upload failed:', uploadError)
          toast.error('Failed to upload media file. Please try again.')
          return
        }
      }

      const postData = {
        society_id: data.society_id,
        type: postType,
        text: data.text.trim(),
        media_url: mediaUrl,
        link_url: postType === 'link' ? data.link_url : undefined
      }

      console.log('Creating post with data:', postData)
      await campusAPI.createPost(postData)
      
      toast.success('Post created successfully!')
      reset()
      setMediaFile(null)
      setMediaPreview(null)
      setPostType('text')
      onSuccess?.()
    } catch (error: any) {
      console.error('Post creation error:', error)
      
      // Handle specific error types
      if (error.message?.includes('FORBIDDEN')) {
        toast.error('You do not have permission to post to this society')
      } else if (error.message?.includes('VALIDATION_ERROR')) {
        toast.error('Please fill in all required fields correctly')
      } else if (error.message?.includes('PROFILE_NOT_FOUND')) {
        toast.error('Your profile could not be found. Please refresh and try again.')
      } else {
        toast.error(error.message || 'Failed to create post. Please try again.')
      }
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setPostType('text')
    setValue('type', 'text')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const postTypeIcons = {
    text: null,
    image: <Image className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    link: <Link className="h-4 w-4" />,
    event: <Calendar className="h-4 w-4" />
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Create New Post</span>
          {postType !== 'text' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              {postTypeIcons[postType]}
              <span className="capitalize">{postType}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Post Content */}
          <div>
            <Label htmlFor="text">What's happening on campus? *</Label>
            <Textarea
              {...register('text', { 
                required: 'Post content is required',
                minLength: { value: 10, message: 'Post must be at least 10 characters long' },
                maxLength: { value: 2000, message: 'Post cannot exceed 2000 characters' },
                validate: (value) => {
                  const trimmed = value.trim()
                  if (trimmed.length < 10) {
                    return 'Post must be at least 10 characters long'
                  }
                  if (trimmed.length > 2000) {
                    return 'Post cannot exceed 2000 characters'
                  }
                  return true
                }
              })}
              placeholder="Share campus news, events, announcements, or connect with your community...\n\nTips:\n• Share upcoming events and activities\n• Highlight achievements and success stories\n• Post important announcements\n• Engage with campus community discussions"
              className="mt-1 min-h-[140px] resize-y"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.text && (
                <p className="text-sm text-red-600">{errors.text.message}</p>
              )}
              <p className={`text-xs ml-auto ${
                (watch('text')?.length || 0) > 1800 
                  ? 'text-orange-600 font-medium' 
                  : 'text-gray-500'
              }`}>
                {watch('text')?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* Link URL for link posts */}
          {postType === 'link' && (
            <div>
              <Label htmlFor="link_url">Link URL *</Label>
              <Input
                {...register('link_url', { 
                  required: postType === 'link' ? 'Link URL is required' : false,
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://'
                  }
                })}
                type="url"
                placeholder="https://example.com"
                className="mt-1"
              />
              {errors.link_url && (
                <p className="mt-1 text-sm text-red-600">{errors.link_url.message}</p>
              )}
            </div>
          )}

          {/* Media Upload */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label>Add Media (Optional)</Label>
              {postType === 'image' && (
                <Badge variant="secondary" className="text-xs">
                  <Image className="h-3 w-3 mr-1" />
                  Image
                </Badge>
              )}
              {postType === 'video' && (
                <Badge variant="secondary" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
            </div>
            
            {mediaPreview ? (
              <div className="relative">
                {postType === 'image' ? (
                  <div className="relative">
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="max-h-64 w-full object-cover rounded-lg border"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                      {mediaFile?.name}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="max-h-64 w-full rounded-lg border"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                      {mediaFile?.name}
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={removeMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative"
                      disabled={isUploading}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Upload Media
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="font-medium">Supported formats:</p>
                    <p>Images: JPEG, PNG, WebP, GIF (max 10MB)</p>
                    <p>Videos: MP4, WebM, MOV (max 50MB)</p>
                  </div>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    Uploading {postType}... Please don't leave this page
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-blue-600">
                  {uploadProgress}% complete
                </p>
              </div>
            )}
          </div>

          {/* Post Type Selection */}
          <div className="space-y-3">
            <Label>Post Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={postType === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPostType('text')
                  setValue('type', 'text')
                  removeMedia()
                }}
                className="justify-start"
              >
                <span className="mr-2">📝</span>
                Text Post
              </Button>
              <Button
                type="button"
                variant={postType === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPostType('link')
                  setValue('type', 'link')
                  removeMedia()
                }}
                className="justify-start"
              >
                <Link className="h-4 w-4 mr-2" />
                Link Post
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Select "Text Post" for general content. Upload images/videos to create media posts automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Post...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}