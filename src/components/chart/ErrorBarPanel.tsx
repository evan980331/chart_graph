import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { NumberInput } from '@/components/ui/NumberInput'
import { useChartStore } from '@/stores/useChartStore'
import type {
  AxisErrorBarSettings,
  ErrorBarConfig,
} from '@/types/analysis'
import type { ErrorSource } from '@/utils/mathStats'
import { cn } from '@/utils/cn'

const SOURCES: { value: ErrorSource; label: string }[] = [
  { value: 'field', label: '來自資料欄位' },
  { value: 'fixed', label: '固定數值' },
  { value: 'percent', label: '百分比 (%)' },
  { value: 'se', label: '自動計算標準誤 SE' },
]

const DIRECTIONS: { value: AxisErrorBarSettings['direction']; label: string }[] = [
  { value: 'both', label: '雙向 ±' },
  { value: 'plus', label: '僅正向 +' },
  { value: 'minus', label: '僅負向 −' },
]

export function ErrorBarPanel() {
  const config = useChartStore((s) => s.errorBar)
  const setConfig = useChartStore((s) => s.setErrorBar)

  function update(axis: 'x' | 'y', patch: Partial<AxisErrorBarSettings>) {
    setConfig({
      ...config,
      [axis]: { ...config[axis], ...patch },
    } satisfies ErrorBarConfig)
  }

  const showValue = (axis: 'x' | 'y') =>
    config[axis].source === 'fixed' || config[axis].source === 'percent'

  return (
    <div className="space-y-4">
      <AxisErrorBar
        title="X 軸誤差棒"
        settings={config.x}
        showValue={showValue('x')}
        onChange={(p) => update('x', p)}
      />
      <AxisErrorBar
        title="Y 軸誤差棒"
        settings={config.y}
        showValue={showValue('y')}
        onChange={(p) => update('y', p)}
      />
    </div>
  )
}

interface AxisErrorBarProps {
  title: string
  settings: AxisErrorBarSettings
  showValue: boolean
  onChange: (patch: Partial<AxisErrorBarSettings>) => void
}

function AxisErrorBar({ title, settings, showValue, onChange }: AxisErrorBarProps) {
  return (
    <fieldset className="space-y-2.5 rounded-md border border-neutral-200 p-3">
      <legend className="px-1 text-xs font-medium text-neutral-500">{title}</legend>

      <div className="space-y-1">
        <Label htmlFor={`${title}-source`}>誤差來源</Label>
        <Select
          id={`${title}-source`}
          value={settings.source}
          onChange={(e) => onChange({ source: e.target.value as ErrorSource })}
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {showValue && (
        <div className="space-y-1">
          <Label htmlFor={`${title}-value`}>
            {settings.source === 'percent' ? '百分比 (%)' : '固定數值'}
          </Label>
          <NumberInput
            id={`${title}-value`}
            step={0.1}
            value={settings.value}
            onChange={(v) => onChange({ value: v ?? 0 })}
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor={`${title}-dir`}>誤差方向</Label>
        <Select
          id={`${title}-dir`}
          value={settings.direction}
          onChange={(e) =>
            onChange({ direction: e.target.value as AxisErrorBarSettings['direction'] })
          }
        >
          {DIRECTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <div className="space-y-1">
            <Label htmlFor={`${title}-color`}>顏色</Label>
            <input
              id={`${title}-color`}
              type="color"
              value={settings.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-9 w-10 cursor-pointer rounded border border-neutral-300 bg-white p-1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${title}-cap`}>端點寬度 (Cap)</Label>
          <NumberInput
            id={`${title}-cap`}
            min={0}
            max={20}
            value={settings.capSize}
            onChange={(v) => onChange({ capSize: v ?? settings.capSize })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${title}-thick`}>線條粗細</Label>
          <NumberInput
            id={`${title}-thick`}
            min={0.5}
            max={5}
            step={0.5}
            value={settings.thickness}
            onChange={(v) => onChange({ thickness: v ?? settings.thickness })}
          />
        </div>
      </div>

      <p
        className={cn(
          'text-[11px] leading-relaxed',
          settings.source === 'field' ? 'text-amber-600' : 'text-neutral-400',
        )}
      >
        {settings.source === 'field'
          ? '套用全方位對應中所選的誤差欄位，若未指定則不顯示。'
          : '來自資料欄位的誤差仍會在「欄位對應」中指定。'}
      </p>
    </fieldset>
  )
}
