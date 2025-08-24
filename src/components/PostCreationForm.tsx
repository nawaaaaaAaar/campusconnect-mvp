import React, { useState, useRef } from 'react'
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
            Only society accounts can create posts. As a student, you can like, comment, and share posts to engage with the campus community.
          </p>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Back to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } = useForm<PostFormData>({
    defaultValues: {
      type: 'text',
      text: ''
    }
  })

  // Load user's societies where they can post
  React.useEffect(() => {
    loadUserSocieties()
  }, [])

  const loadUserSocieties = async () => {
    setLoadingSocieties(true)
    try {
      const response = await campusAPI.getProfile()
      // Get societies where user is a member
      const memberSocieties = response.data.society_memberships || []
      setSocieties(memberSocieties)
    } catch (error: any) {
      toast.error('Failed to load societies')
    } finally {
      setLoadingSocieties(false)
    }
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
    try {
      let mediaUrl = null
      if (mediaFile && (postType === 'image' || postType === 'video')) {
        mediaUrl = await uploadMediaFile()
      }

      const postData = {
        society_id: data.society_id,
        type: postType,
        text: data.text,
        media_url: mediaUrl,
        link_url: postType === 'link' ? data.link_url : undefined
      }

      await campusAPI.createPost(postData)
      
      toast.success('Post created successfully!')
      reset()
      setMediaFile(null)
      setMediaPreview(null)
      setPostType('text')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post')
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
          {/* Society Selection */}
          <div>
            <Label htmlFor="society_id">Post to Society *</Label>
            <select
              {...register('society_id', { required: 'Please select a society' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingSocieties}
            >
              <option value="">Select a society...</option>
              {societies.map((membership) => (
                <option key={membership.society_id} value={membership.society_id}>
                  {membership.societies?.name || 'Unknown Society'}
                </option>
              ))}
            </select>
            {errors.society_id && (
              <p className="mt-1 text-sm text-red-600">{errors.society_id.message}</p>
            )}
          </div>

          {/* Post Content */}
          <div>
            <Label htmlFor="text">What's happening on campus? *</Label>
            <Textarea
              {...register('text', { 
                required: 'Post content is required',
                minLength: { value: 10, message: 'Post must be at least 10 characters long' },
                maxLength: { value: 2000, message: 'Post cannot exceed 2000 characters' }
              })}
              placeholder="Share news, events, announcements, or just connect with your campus community..."
              className="mt-1 min-h-[120px]"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.text && (
                <p className="text-sm text-red-600">{errors.text.message}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
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
              <Label>Add Media</Label>
            </div>
            
            {mediaPreview ? (
              <div className="relative">
                {postType === 'image' ? (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="max-h-64 w-full object-cover rounded-lg"
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="max-h-64 w-full rounded-lg"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Upload Image/Video
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Images: JPEG, PNG, WebP, GIF (max 10MB)<br />
                    Videos: MP4, WebM, MOV (max 50MB)
                  </p>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Uploading media...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* Post Type Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={postType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setPostType('text')
                setValue('type', 'text')
                removeMedia()
              }}
            >
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
            >
              <Link className="h-4 w-4 mr-1" />
              Link Post
            </Button>
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