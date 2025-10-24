import React, { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Loader2, AlertCircle } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { toast } from 'sonner'

interface EditPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: {
    id: string
    text: string
    created_at: string
  }
  onSuccess: () => void
}

export function EditPostDialog({ open, onOpenChange, post, onSuccess }: EditPostDialogProps) {
  const [text, setText] = useState(post.text)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  React.useEffect(() => {
    if (!open) return

    // Calculate time remaining for edit window
    const createdAt = new Date(post.created_at)
    const now = new Date()
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    const remaining = Math.max(0, 15 - minutesElapsed)
    setTimeRemaining(remaining)

    // Update timer every minute
    const interval = setInterval(() => {
      const now = new Date()
      const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60)
      const remaining = Math.max(0, 15 - minutesElapsed)
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        toast.error('Edit window expired')
        onOpenChange(false)
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [open, post.created_at, onOpenChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      toast.error('Post content cannot be empty')
      return
    }

    if (text.trim() === post.text.trim()) {
      toast.info('No changes made')
      return
    }

    setSubmitting(true)
    try {
      await campusAPI.editPost(post.id, { text: text.trim() })
      toast.success('Post updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Edit post error:', error)
      
      if (error.message?.includes('EDIT_WINDOW_EXPIRED')) {
        toast.error('Edit window expired (15 minutes)')
      } else {
        toast.error(error.message || 'Failed to update post')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Make changes to your post. You can only edit within 15 minutes of posting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                {Math.floor(timeRemaining)} minute{Math.floor(timeRemaining) !== 1 ? 's' : ''} remaining to edit
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="text">Post Content</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[150px]"
              maxLength={2000}
              required
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {text.length}/2000 characters
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !text.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}





