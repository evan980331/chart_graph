import type { ReactNode } from 'react'
import { BarChart3, LineChart, ScatterChart } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useChartStore } from '@/stores/useChartStore'
import type { ChartType } from '@/types/chart'

const options: { value: ChartType; label: string; icon: ReactNode }[] = [
  { value: 'scatter', label: '散佈圖', icon: <ScatterChart className="h-3.5 w-3.5" /> },
  { value: 'line', label: '折線圖', icon: <LineChart className="h-3.5 w-3.5" /> },
  { value: 'bar', label: '柱狀圖', icon: <BarChart3 className="h-3.5 w-3.5" /> },
]

export function ChartTypeSelector() {
  const chartType = useChartStore((s) => s.chartType)
  const setChartType = useChartStore((s) => s.setChartType)

  return (
    <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setChartType(opt.value)}
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 rounded px-2 py-1.5 text-[11px] font-medium transition-colors',
            chartType === opt.value
              ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200'
              : 'text-neutral-500 hover:text-neutral-800',
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
