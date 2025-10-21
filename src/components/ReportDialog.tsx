import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import { campusAPI } from '../lib/api'
import { toast } from 'sonner'
import { telemetry } from '../lib/telemetry'
import { useAuth } from '../contexts/AuthContext'

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: 'post' | 'comment' | 'society' | 'user'
  targetId: string
  targetDetails?: {
    title?: string
    author?: string
  }
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or Scam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'misinformation', label: 'Misinformation or False Information' },
  { value: 'violence', label: 'Violence or Threats' },
  { value: 'hate_speech', label: 'Hate Speech or Discrimination' },
  { value: 'impersonation', label: 'Impersonation or Fake Account' },
  { value: 'copyright', label: 'Copyright Violation' },
  { value: 'other', label: 'Other' },
]

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetDetails,
}: ReportDialogProps) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for reporting')
      return
    }

    setSubmitting(true)
    try {
      // PRD 5.8: Submit report
      await campusAPI.createReport({
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || undefined,
      })

      // PRD 14: Track telemetry
      telemetry.track('report_created', {
        user_id: user?.id,
        target_type: targetType,
        target_id: targetId,
        reason,
      })

      toast.success('Report submitted successfully. Our team will review it shortly.')
      
      // Reset form and close
      setReason('')
      setDescription('')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Report submission error:', error)
      toast.error(error.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setReason('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <DialogTitle>Report {targetType}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Help us understand what's wrong with this {targetType}. Your report is anonymous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-red-600">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help us review this report..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{description.length}/500 characters</p>
          </div>

          {/* Target Info */}
          {targetDetails && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-600">Reporting:</p>
              <p className="font-medium text-gray-900">
                {targetDetails.title || targetDetails.author || `${targetType} ${targetId.substring(0, 8)}`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



