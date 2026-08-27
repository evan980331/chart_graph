import { useState } from 'react'
import { Sparkles, X, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { allTemplates, SUBJECT_LABELS, SUBJECT_ORDER } from '@/constants/templates'
import type { Subject, TemplateConfig } from '@/types/template'
import { useChartStore } from '@/stores/useChartStore'
import { toast } from '@/utils/toast'

interface TemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateModal({ open, onOpenChange }: TemplateModalProps) {
  const [activeSubject, setActiveSubject] = useState<Subject>('physics')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null)
  const [confirming, setConfirming] = useState(false)

  const loadProject = useChartStore((s) => s.loadProject)

  if (!open) return null

  const templates = allTemplates.filter((t) => t.subject === activeSubject)

  function handleApply() {
    if (!selectedTemplate) return
    loadProject({
      rawData: selectedTemplate.data,
      mapping: selectedTemplate.mapping,
      chartType: selectedTemplate.chartType,
      config: selectedTemplate.config,
      regression: selectedTemplate.regression,
      errorBar: selectedTemplate.errorBar,
      styleConfig: selectedTemplate.styleConfig,
    })
    toast(`已成功套用模板：「${selectedTemplate.title}」`, 'success')
    setConfirming(false)
    setSelectedTemplate(null)
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-6">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-neutral-900" />
            <h2 className="text-base font-semibold text-neutral-900">
              研究型圖表模板庫（高中 108 課綱探究實作）
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              setConfirming(false)
              setSelectedTemplate(null)
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar: Subjects */}
          <div className="w-56 shrink-0 border-r border-neutral-200 bg-neutral-50 p-3 space-y-1">
            {SUBJECT_ORDER.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setActiveSubject(subj)
                  setSelectedTemplate(null)
                  setConfirming(false)
                }}
                className={`w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeSubject === subj
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-200/60'
                }`}
              >
                {SUBJECT_LABELS[subj]}
              </button>
            ))}
          </div>

          {/* Right Content: Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {templates.map((t) => {
                const isSelected = selectedTemplate?.id === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t)
                      setConfirming(false)
                    }}
                    className={`group relative flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-neutral-950 bg-neutral-50/80 ring-2 ring-neutral-950/20'
                        : 'border-neutral-200 hover:border-neutral-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-black">
                          {t.title}
                        </h3>
                        {isSelected && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100">
                      <div className="flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-neutral-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        預覽 <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer / Confirm bar */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-3.5">
          <div className="text-xs text-neutral-500">
            {selectedTemplate
              ? `已選擇：${selectedTemplate.title}`
              : '請從右側選擇一個實驗模板進行預覽與套用'}
          </div>
          <div className="flex items-center gap-2">
            {confirming ? (
              <>
                <span className="text-xs font-medium text-red-600">
                  確定要覆蓋目前資料？
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  取消
                </Button>
                <Button size="sm" onClick={handleApply}>
                  確認套用
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                disabled={!selectedTemplate}
                onClick={() => setConfirming(true)}
              >
                套用此範本
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
