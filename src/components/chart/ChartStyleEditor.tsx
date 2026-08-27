import { AlertTriangle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useChartStore } from '@/stores/useChartStore'
import type {
  ChartStyleConfig,
  FontFamily,
  GridLineStyle,
  TickDirection,
} from '@/types/style'
import { cn } from '@/utils/cn'

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'times', label: 'Times New Roman' },
  { value: 'arial', label: 'Arial' },
  { value: 'noto', label: '思源黑體 (Noto Sans TC)' },
]

const TICK_OPTIONS: { value: TickDirection; label: string }[] = [
  { value: 'outside', label: '朝外' },
  { value: 'inside', label: '朝內' },
]

const GRID_OPTIONS: { value: GridLineStyle; label: string }[] = [
  { value: 'solid', label: '實線' },
  { value: 'dashed', label: '虛線' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ChartStyleEditor() {
  const style = useChartStore((s) => s.styleConfig)
  const setStyle = useChartStore((s) => s.setStyleConfig)

  function update(patch: Partial<ChartStyleConfig>) {
    setStyle({ ...style, ...patch })
  }

  // 即時驗證：刻度範圍必須合理
  const xValid = !(style.xMin != null && style.xMax != null && style.xMax <= style.xMin)
  const yValid = !(style.yMin != null && style.yMax != null && style.yMax <= style.yMin)

  return (
    <div className="space-y-4">
      {/* 字體與文字 */}
      <fieldset className="space-y-2.5 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-xs font-medium text-neutral-500">
          字體與文字
        </legend>
        <div className="space-y-1">
          <Label htmlFor="style-font">字體</Label>
          <Select
            id="style-font"
            value={style.font}
            onChange={(e) => update({ font: e.target.value as FontFamily })}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="style-fontsize"
            label="標題字級"
            value={style.fontSize}
            min={8}
            max={24}
            onChange={(v) => update({ fontSize: v })}
          />
          <NumberField
            id="style-tickfont"
            label="刻度字級"
            value={style.tickFontSize}
            min={8}
            max={24}
            onChange={(v) => update({ tickFontSize: v })}
          />
        </div>
      </fieldset>

      {/* 軸線與刻度 */}
      <fieldset className="space-y-2.5 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-xs font-medium text-neutral-500">
          軸線與刻度
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="style-axiscolor">軸線顏色</Label>
              <div className="mt-1 h-9 w-14 rounded border border-neutral-300 bg-white p-1">
                <input
                  id="style-axiscolor"
                  type="color"
                  value={style.axisColor}
                  onChange={(e) => update({ axisColor: e.target.value })}
                  className="h-full w-full cursor-pointer border-0 p-0"
                />
              </div>
            </div>
            <NumberField
              id="style-axiswidth"
              label="軸線粗細"
              value={style.axisWidth}
              min={0.5}
              max={4}
              step={0.5}
              onChange={(v) => update({ axisWidth: v })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="style-tickdir">刻度方向</Label>
          <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
            {TICK_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => update({ tickDirection: o.value })}
                className={cn(
                  'flex-1 rounded px-2 py-1 text-xs transition-colors',
                  style.tickDirection === o.value
                    ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                    : 'text-neutral-500',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <AxisRange
          title="X 軸範圍"
          min={style.xMin}
          max={style.xMax}
          step={style.xStep}
          valid={xValid}
          onMin={(v) => update({ xMin: v })}
          onMax={(v) => update({ xMax: v })}
          onStep={(v) => update({ xStep: v })}
        />
        <AxisRange
          title="Y 軸範圍"
          min={style.yMin}
          max={style.yMax}
          step={style.yStep}
          valid={yValid}
          onMin={(v) => update({ yMin: v })}
          onMax={(v) => update({ yMax: v })}
          onStep={(v) => update({ yStep: v })}
        />

        {(!xValid || !yValid) && (
          <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-inset ring-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>最大值必須大於最小值（X / Y 軸）</span>
          </p>
        )}
      </fieldset>

      {/* 網格與背景 */}
      <fieldset className="space-y-2.5 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-xs font-medium text-neutral-500">
          網格與背景
        </legend>
        <label className="flex items-center justify-between">
          <span className="text-sm text-neutral-800">X 軸網格</span>
          <Switch
            checked={style.showXGrid}
            onChange={(v) => update({ showXGrid: v })}
          />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-neutral-800">Y 軸網格</span>
          <Switch
            checked={style.showYGrid}
            onChange={(v) => update({ showYGrid: v })}
          />
        </label>
        <div className="space-y-1">
          <Label htmlFor="style-grid">網格線型</Label>
          <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
            {GRID_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => update({ gridStyle: o.value })}
                className={cn(
                  'flex-1 rounded px-2 py-1 text-xs transition-colors',
                  style.gridStyle === o.value
                    ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                    : 'text-neutral-500',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const raw = Number(e.target.value)
          onChange(Number.isFinite(raw) ? clamp(raw, min, max) : min)
        }}
      />
    </div>
  )
}

function AxisRange({
  title,
  min,
  max,
  step,
  valid,
  onMin,
  onMax,
  onStep,
}: {
  title: string
  min?: number
  max?: number
  step?: number
  valid: boolean
  onMin: (v?: number) => void
  onMax: (v?: number) => void
  onStep: (v?: number) => void
}) {
  return (
    <div className={cn('space-y-1', !valid && 'opacity-90')}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-500">{title}</Label>
        <span className="text-[10px] text-neutral-400">留空 = 自動</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-0.5">
          <span className="text-[10px] text-neutral-400">最小值</span>
          <Input
            type="number"
            value={min ?? ''}
            placeholder="自動"
            onChange={(e) =>
              onMin(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-neutral-400">最大值</span>
          <Input
            type="number"
            value={max ?? ''}
            placeholder="自動"
            onChange={(e) =>
              onMax(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-neutral-400">間距</span>
          <Input
            type="number"
            value={step ?? ''}
            placeholder="自動"
            onChange={(e) =>
              onStep(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </div>
      </div>
    </div>
  )
}
