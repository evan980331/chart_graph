import { AlertTriangle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useChartStore } from '@/stores/useChartStore'
import type { ColumnMapping } from '@/types/chart'

export function ColumnMapper() {
  const columns = useChartStore((s) => s.columns)
  const mapping = useChartStore((s) => s.mapping)
  const setMapping = useChartStore((s) => s.setMapping)
  const invalidCount = useChartStore((s) => s.invalidCount)
  const rawData = useChartStore((s) => s.rawData)

  const hasData = rawData.length > 0 && columns.length > 0

  function update(field: keyof ColumnMapping, value: string) {
    setMapping({ ...mapping, [field]: value || undefined })
  }

  if (!hasData) {
    return (
      <div className="px-3 py-4 text-center text-xs text-neutral-400">
        匯入數據後即可指定欄位對應。
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2.5">
        <MappingSelect
          id="map-x"
          label="X 軸資料欄位"
          required
          value={mapping.xAxis}
          columns={columns}
          onChange={(v) => update('xAxis', v)}
        />
        <MappingSelect
          id="map-y"
          label="Y 軸資料欄位"
          required
          value={mapping.yAxis}
          columns={columns}
          onChange={(v) => update('yAxis', v)}
        />
        <MappingSelect
          id="map-xerr"
          label="X 軸誤差棒欄位 (選填)"
          value={mapping.xError ?? ''}
          columns={columns}
          onChange={(v) => update('xError', v)}
        />
        <MappingSelect
          id="map-yerr"
          label="Y 軸誤差棒欄位 (選填)"
          value={mapping.yError ?? ''}
          columns={columns}
          onChange={(v) => update('yError', v)}
        />
      </fieldset>

      {invalidCount > 0 && (
        <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            已自動忽略 {invalidCount} 筆包含空值或非數值的資料
          </span>
        </p>
      )}
    </div>
  )
}

interface MappingSelectProps {
  id: string
  label: string
  value: string
  columns: string[]
  onChange: (value: string) => void
  required?: boolean
}

function MappingSelect({
  id,
  label,
  value,
  columns,
  onChange,
  required,
}: MappingSelectProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {!required && <option value="">— 不使用 —</option>}
        {columns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </Select>
    </div>
  )
}
