import { lazy, Suspense, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { Header } from '@/components/layout/Header'
import { DataPanel } from '@/components/data/DataPanel'
import { StylePanel } from '@/components/chart/StylePanel'
import { ToastHost } from '@/components/ui/ToastHost'
import { TemplateModal } from '@/components/template/TemplateModal'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { FeaturesModal } from '@/components/features/FeaturesModal'
import { ChangelogModal } from '@/components/changelog/ChangelogModal'
import { useChartStore } from '@/stores/useChartStore'
import { parseCSV, parseExcel, parseTxt } from '@/utils/fileParser'
import { toast } from '@/utils/toast'
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

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function defaultExportName(): string {
  const d = new Date()
  return `實驗_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.png`
}

export function MainLayout() {
  const setConfig = useChartStore((s) => s.setConfig)
  const importRows = useChartStore((s) => s.importRows)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chart')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExportPng() {
    const div = document.getElementById('labplot-chart')
    if (!div) {
      toast('找不到圖表，請先建立數據', 'error')
      return
    }
    try {
      const gd = div as unknown as { _fullLayout?: { font?: { size?: number }; title?: { font?: { size?: number } } } }
      const fl = gd._fullLayout || {}
      const baseFontSize = fl.font?.size ?? 14
      const baseTitleSize = fl.title?.font?.size ?? 18
      const fontScale = 1.5

      await Plotly.relayout(div, {
        title: { font: { size: baseTitleSize * fontScale } },
        font: { size: baseFontSize * fontScale },
        margin: { l: 105, r: 60, t: 90, b: 90 },
      } as Partial<Plotly.Layout>)

      const dataUrl = await Plotly.toImage(div, {
        format: 'png',
        width: 1200,
        height: 800,
        scale: 3,
      })

      await Plotly.relayout(div, {
        title: { font: { size: baseTitleSize } },
        font: { size: baseFontSize },
        margin: { l: 70, r: 40, t: 60, b: 60 },
      } as Partial<Plotly.Layout>)

      downloadDataUrl(dataUrl, defaultExportName())
      toast('已匯出 PNG 圖表', 'success')
    } catch {
      toast('匯出失敗，請稍後再試', 'error')
    }
  }

  async function handleImportFile(file: File) {
    try {
      let rows
      if (file.name.endsWith('.csv')) {
        rows = await parseCSV(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rows = await parseExcel(file)
      } else if (file.name.endsWith('.txt')) {
        rows = await parseTxt(file)
      } else {
        toast('僅支援 .csv、.xlsx 或 .txt 檔案', 'error')
        return
      }
      if (rows.length === 0) {
        toast('未解析到任何有效數據', 'error')
        return
      }
      importRows(rows)
      toast(`已匯入 ${file.name}（${rows.length} 筆）`, 'success')
    } catch (e) {
      toast(`解析失敗：${(e as Error).message}`, 'error')
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 text-neutral-900">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImportFile(file)
          e.target.value = ''
        }}
      />
      <Header
        onImport={() => fileInputRef.current?.click()}
        onExport={handleExportPng}
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
