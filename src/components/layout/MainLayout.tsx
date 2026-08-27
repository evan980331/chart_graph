import { lazy, Suspense, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { DataPanel } from '@/components/data/DataPanel'
import { StylePanel } from '@/components/chart/StylePanel'
import { ToastHost } from '@/components/ui/ToastHost'
import { TemplateModal } from '@/components/template/TemplateModal'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { FeaturesModal } from '@/components/features/FeaturesModal'
import { ChangelogModal } from '@/components/changelog/ChangelogModal'
import { useChartStore } from '@/stores/useChartStore'
import { cn } from '@/utils/cn'

const ScientificChart = lazy(() =>
  import('@/components/chart/ScientificChart').then((m) => ({ default: m.ScientificChart })),
)

function ChartSkeleton({ height = 480 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-neutral-200"
      style={{ height }}
      aria-label="圖表載入中"
    />
  )
}

type MobileTab = 'data' | 'chart' | 'style'

export function MainLayout() {
  const setConfig = useChartStore((s) => s.setConfig)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chart')

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 text-neutral-900">
      <Header
        onTemplate={() => setTemplateOpen(true)}
        onFeedback={() => setFeedbackOpen(true)}
        onFeatures={() => setFeaturesOpen(true)}
        onChangelog={() => setChangelogOpen(true)}
      />
      <ToastHost />

      {/* Desktop: 3-column layout (>= 1024px) */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        <DataPanel />
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto p-6">
          <Suspense fallback={<ChartSkeleton />}>
            <ScientificChart />
          </Suspense>
          <p className="text-xs text-neutral-400">
            匯入數據後可切換散佈 / 折線 / 柱狀圖，調整視窗大小時圖表會自動響應。
          </p>
        </main>
        <StylePanel config={useChartStore((s) => s.config)} onChange={setConfig} />
      </div>

      {/* Mobile/Tablet: tabbed layout (< 1024px) */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="flex shrink-0 border-b border-neutral-200 bg-white">
          {([
            { id: 'data' as const, label: '數據輸入' },
            { id: 'chart' as const, label: '圖表預覽' },
            { id: 'style' as const, label: '屬性設定' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium transition-colors',
                mobileTab === tab.id
                  ? 'border-b-2 border-neutral-900 text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {mobileTab === 'data' && <DataPanel />}
          {mobileTab === 'chart' && (
            <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-4">
              <Suspense fallback={<ChartSkeleton height={360} />}>
                <ScientificChart height={360} />
              </Suspense>
              <p className="text-xs text-neutral-400">
                匯入數據後可切換散佈 / 折線 / 柱狀圖。
              </p>
            </main>
          )}
          {mobileTab === 'style' && (
            <StylePanel config={useChartStore((s) => s.config)} onChange={setConfig} />
          )}
        </div>
      </div>

      <TemplateModal open={templateOpen} onOpenChange={setTemplateOpen} />
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <FeaturesModal open={featuresOpen} onOpenChange={setFeaturesOpen} />
      <ChangelogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
    </div>
  )
}
