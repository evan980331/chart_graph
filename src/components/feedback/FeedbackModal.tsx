import { useState } from 'react'
import { X, Star, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Role = 'student' | 'teacher' | 'other'
type IssueType = 'bug' | 'feature' | 'ui'

const ROLE_LABELS: Record<Role, string> = {
  student: '高中生',
  teacher: '教師',
  other: '其他',
}

const ISSUE_LABELS: Record<IssueType, string> = {
  bug: 'Bug 舉報',
  feature: '功能建議',
  ui: 'UI 體驗',
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [role, setRole] = useState<Role>('student')
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [issueType, setIssueType] = useState<IssueType>('bug')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  function reset() {
    setRole('student')
    setRating(0)
    setHoveredStar(0)
    setIssueType('bug')
    setDescription('')
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  async function handleSubmit() {
    if (rating === 0) {
      toast('請點選評分星星', 'error')
      return
    }
    if (!description.trim()) {
      toast('請填寫問題描述', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Formspree / Web3Forms endpoint — replace with actual endpoint
      const payload = {
        role,
        rating,
        issueType,
        description: description.trim(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }

      console.log('[Feedback] 提交反饋資料：', payload)

      // TODO: 替換為實際 API endpoint
      // await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // })

      toast('感謝你的反饋！我們會認真看待每一則建議。', 'success')
      handleClose()
    } catch {
      toast('送出失敗，請稍後再試', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-6">
          <h2 className="text-base font-semibold text-neutral-900">
            問題與建議回報
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800">
              你的身分
            </label>
            <div className="flex gap-2">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    role === r
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800">
              整體滿意度
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-neutral-200 text-neutral-200'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-neutral-500">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800">
              問題類型
            </label>
            <div className="flex gap-2">
              {(Object.keys(ISSUE_LABELS) as IssueType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setIssueType(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    issueType === t
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {ISSUE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800">
              問題描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="請詳細描述遇到的問題或建議的改進方向⋯"
              rows={4}
              className="w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={handleClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                送出中…
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                送出反饋
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
