import { FlaskConical, FileText, Presentation } from 'lucide-react'
import { useChartStore } from '@/stores/useChartStore'
import {
  POSTER_STYLE,
  REPORT_STYLE,
  SLIDE_STYLE,
  type ChartStyleConfig,
} from '@/types/style'
import { cn } from '@/utils/cn'

interface PresetDef {
  key: string
  name: string
  desc: string
  icon: 'poster' | 'report' | 'slide'
  patch: Partial<ChartStyleConfig>
}

const PRESETS: PresetDef[] = [
  {
    key: 'poster',
    name: '科展展板',
    desc: '粗軸線、大字級、高對比黑線，適合大型海報輸出',
    icon: 'poster',
    patch: POSTER_STYLE,
  },
  {
    key: 'report',
    name: 'PDF 報告',
    desc: '標準 Times 字體、細軸線、關閉背景網格，符合小論文規範',
    icon: 'report',
    patch: REPORT_STYLE,
  },
  {
    key: 'slide',
    name: '簡報投影片',
    desc: '大型數據點與粗擬合線，便於遠距離展示',
    icon: 'slide',
    patch: SLIDE_STYLE,
  },
]

function PresetIcon({ icon }: { icon: PresetDef['icon'] }) {
  const cls = 'h-5 w-5'
  if (icon === 'poster') return <FlaskConical className={cls} />
  if (icon === 'report') return <FileText className={cls} />
  return <Presentation className={cls} />
}

export function ThemePresets() {
  const styleConfig = useChartStore((s) => s.styleConfig)
  const setStyleConfig = useChartStore((s) => s.setStyleConfig)

  function applyPreset(patch: Partial<ChartStyleConfig>) {
    // 合併至目前 styleConfig：保留數據與標題（標題位於 config，不受影響）
    setStyleConfig({ ...styleConfig, ...patch })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500">按應用場景一鍵套用預設樣式</p>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => applyPreset(p.patch)}
          className={cn(
            'flex w-full items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-neutral-400',
          )}
        >
          <span className="mt-0.5 text-neutral-700">
            <PresetIcon icon={p.icon} />
          </span>
          <span>
            <span className="block text-sm font-medium text-neutral-900">
              {p.name}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
              {p.desc}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
