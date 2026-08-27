import { lazy, Suspense, useRef, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { DataPanel } from '@/components/data/DataPanel'
import { StylePanel } from '@/components/chart/StylePanel'
import { Resizer } from '@/components/ui/Resizer'
import { ToastHost } from '@/components/ui/ToastHost'
import { TemplateModal } from '@/components/template/TemplateModal'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { FeaturesModal } from '@/components/features/FeaturesModal'
import { ChangelogModal } from '@/components/changelog/ChangelogModal'
import { useChartStore } from '@/stores/useChartStore'
import { parseCSV, parseExcel, parseTxt } from '@/utils/fileParser'
import {
  exportChartAsDataUrl,
  downloadDataUrl,
} from '@/utils/exportChart'
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
  const [styleWidth, setStyleWidth] = useState(320)
  const [dataHeight, setDataHeight] = useState(300)

  async function handleExportPng() {
    try {
      const dataUrl = await exportChartAsDataUrl({
        format: 'png',
        width: 1200,
        height: 800,
        scale: 3,
      })
      if (!dataUrl) {
        toast('找不到圖表，請先建立數據', 'error')
        return
      }
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

      {/* Desktop: resizable layout (>= 1024px)
          - 上方：圖表 (flex) + 屬性面板 (可拖曳寬度)
          - 下方：數據表格 (全寬，可拖曳高度) */}
      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col p-4">
            <div className="flex min-h-0 flex-1 items-stretch justify-center">
              <Suspense fallback={<ChartSkeleton />}>
                <ScientificChart fill />
              </Suspense>
            </div>
            <p className="mt-2 shrink-0 text-center text-xs text-neutral-400">
              匯入數據後可切換散佈 / 折線 / 柱狀圖，拖曳分隔線可調整面板大小。
            </p>
          </main>

          <Resizer
            orientation="vertical"
            value={styleWidth}
            min={240}
            max={560}
            onChange={setStyleWidth}
            ariaLabel="調整屬性面板寬度"
          />
          <div
            style={{ width: styleWidth }}
            className="flex h-full shrink-0 flex-col"
          >
            <StylePanel
              config={useChartStore((s) => s.config)}
              onChange={setConfig}
            />
          </div>
        </div>

        <Resizer
          orientation="horizontal"
          value={dataHeight}
          min={160}
          max={600}
          onChange={setDataHeight}
          ariaLabel="調整數據面板高度"
        />
        <div
          style={{ height: dataHeight }}
          className="flex shrink-0 flex-col"
        >
          <DataPanel variant="bottom" />
        </div>
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
