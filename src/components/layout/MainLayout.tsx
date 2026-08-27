import { Header } from '@/components/layout/Header'
import { DataPanel } from '@/components/data/DataPanel'
import { StylePanel } from '@/components/chart/StylePanel'
import { ScientificChart } from '@/components/chart/ScientificChart'
import { ToastHost } from '@/components/ui/ToastHost'
import { useChartStore } from '@/stores/useChartStore'

export function MainLayout() {
  const setConfig = useChartStore((s) => s.setConfig)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 text-neutral-900">
      <Header />
      <ToastHost />

      <div className="flex min-h-0 flex-1">
        <DataPanel />

        <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto p-6">
          <ScientificChart />
          <p className="text-xs text-neutral-400">
            匯入數據後可切換散佈 / 折線 / 柱狀圖，調整視窗大小時圖表會自動響應。
          </p>
        </main>

        <StylePanel config={useChartStore((s) => s.config)} onChange={setConfig} />
      </div>
    </div>
  )
}
