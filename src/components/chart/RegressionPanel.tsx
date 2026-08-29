import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { NumberInput } from '@/components/ui/NumberInput'
import { Switch } from '@/components/ui/switch'
import { useChartStore, toNumber } from '@/stores/useChartStore'
import { REGRESSION_TYPE_LABELS, fitRegression } from '@/utils/mathStats'
import type { RegressionSettings, RegressionType } from '@/types/analysis'
import { cn } from '@/utils/cn'

const LINE_STYLES: { value: RegressionSettings['lineStyle']; label: string }[] = [
  { value: 'solid', label: '實線' },
  { value: 'dashed', label: '虛線' },
  { value: 'dotted', label: '點線' },
]

export function RegressionPanel() {
  const regression = useChartStore((s) => s.regression)
  const setRegression = useChartStore((s) => s.setRegression)
  const rawData = useChartStore((s) => s.rawData)
  const mapping = useChartStore((s) => s.mapping)

  function update(patch: Partial<RegressionSettings>) {
    setRegression({ ...regression, ...patch })
  }

  const fit = (() => {
    if (!regression.enabled || !mapping.xAxis || !mapping.yAxis) return null
    const pts: { x: number; y: number }[] = []
    for (const r of rawData) {
      const x = toNumber(r[mapping.xAxis])
      const y = toNumber(r[mapping.yAxis])
      if (x === null || y === null) continue
      pts.push({ x, y })
    }
    if (pts.length === 0) return null
    return fitRegression(pts, regression.type, { forceZeroIntercept: regression.forceZeroIntercept })
  })()

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between">
        <span className="text-sm text-neutral-800">擬合曲線</span>
        <Switch
          checked={regression.enabled}
          onChange={(checked) => update({ enabled: checked })}
        />
      </label>

      <div className="space-y-1">
        <Label htmlFor="reg-type">擬合類型</Label>
        <Select
          id="reg-type"
          value={regression.type}
          disabled={!regression.enabled}
          onChange={(e) => update({ type: e.target.value as RegressionType })}
        >
          {(Object.keys(REGRESSION_TYPE_LABELS) as RegressionType[]).map((t) => (
            <option key={t} value={t}>
              {REGRESSION_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      <label
        className={cn(
          'flex items-center justify-between',
          !regression.enabled && 'opacity-40',
        )}
      >
        <span className="text-sm text-neutral-800">強制截距為 0（過原點）</span>
        <Switch
          checked={regression.forceZeroIntercept}
          disabled={!regression.enabled}
          onChange={(checked) => update({ forceZeroIntercept: checked })}
        />
      </label>

      {regression.enabled && fit && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
          <div>Equation: {fit.formula}</div>
          <div>R²: {Number.isFinite(fit.r2) ? fit.r2.toFixed(4) : 'N/A'}</div>
          <div>Data: {fit.usedCount} / {fit.totalCount} points used</div>
          {fit.excludedCount > 0 && (
            <div>
              Excluded: {fit.excludedCount} points
              {fit.exclusionReasons && Object.keys(fit.exclusionReasons).length > 0
                ? ` (${Object.entries(fit.exclusionReasons).map(([k, v]) => `${v} × ${k}`).join('、')})`
                : ''}
            </div>
          )}
          {fit.status !== 'ok' && fit.reason && <div className="text-amber-700">{fit.status}: {fit.reason}</div>}
          {fit.status === 'ok' && <div className="text-emerald-700">status: ok</div>}
        </div>
      )}

      <fieldset className="space-y-1.5" disabled={!regression.enabled}>
        <Label>線條樣式</Label>
        <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
          {LINE_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => update({ lineStyle: s.value })}
              className={cn(
                'flex-1 rounded px-2 py-1 text-xs transition-colors',
                regression.lineStyle === s.value
                  ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                  : 'text-neutral-500',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="reg-color">顏色</Label>
            <div className="flex items-center gap-2">
              <input
                id="reg-color"
                type="color"
                value={regression.lineColor}
                onChange={(e) => update({ lineColor: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded border border-neutral-300 bg-white p-1"
              />
              <span className="text-xs text-neutral-400">
                {regression.lineColor}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-width">粗細</Label>
            <NumberInput
              id="reg-width"
              min={0.5}
              max={5}
              step={0.5}
              value={regression.lineWidth}
              onChange={(v) => v !== undefined && update({ lineWidth: v })}
            />
          </div>
        </div>
      </fieldset>
    </div>
  )
}
