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
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  requireReason?: boolean
  onConfirm: (reason?: string) => Promise<void>
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  requireReason = false,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      return
    }

    setDeleting(true)
    try {
      await onConfirm(requireReason ? reason.trim() : undefined)
      onOpenChange(false)
      setReason('')
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    setReason('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="reason">
              Reason for deletion <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for this deletion (required for audit trail)"
              className="min-h-[100px]"
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500">{reason.length}/500 characters</p>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting || (requireReason && !reason.trim())}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}





