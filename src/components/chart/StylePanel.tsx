import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SymbolPicker } from '@/components/chart/SymbolPicker'
import { ChartTypeSelector } from '@/components/chart/ChartTypeSelector'
import { RegressionPanel } from '@/components/chart/RegressionPanel'
import { ErrorBarPanel } from '@/components/chart/ErrorBarPanel'
import { ChartStyleEditor } from '@/components/chart/ChartStyleEditor'
import { ThemePresets } from '@/components/chart/ThemePresets'
import { ExportPanel } from '@/components/chart/ExportPanel'
import { ProjectPanel } from '@/components/chart/ProjectPanel'
import type { AxisConfig, ChartConfig } from '@/types/chart'

interface StylePanelProps {
  config: ChartConfig
  onChange: (config: ChartConfig) => void
}

interface AxisFieldsProps {
  axis: 'xAxis' | 'yAxis'
  value: AxisConfig
  onChange: (axis: AxisConfig) => void
}

function AxisFields({ axis, value, onChange }: AxisFieldsProps) {
  const title = axis === 'xAxis' ? 'X 軸' : 'Y 軸'

  function insertSymbol(symbol: string) {
    onChange({ ...value, label: value.label + symbol })
  }

  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-1 text-xs font-medium text-neutral-500">
        {title}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${axis}-label`}>標籤</Label>
            <SymbolPicker onInsert={insertSymbol} />
          </div>
          <Input
            id={`${axis}-label`}
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${axis}-unit`}>單位</Label>
          <Input
            id={`${axis}-unit`}
            value={value.unit}
            onChange={(e) => onChange({ ...value, unit: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${axis}-min`}>最小值</Label>
          <Input
            id={`${axis}-min`}
            type="number"
            value={value.min ?? ''}
            placeholder="自動"
            onChange={(e) =>
              onChange({
                ...value,
                min: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${axis}-max`}>最大值</Label>
          <Input
            id={`${axis}-max`}
            type="number"
            value={value.max ?? ''}
            placeholder="自動"
            onChange={(e) =>
              onChange({
                ...value,
                max: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${axis}-step`}>間距</Label>
          <Input
            id={`${axis}-step`}
            type="number"
            value={value.step ?? ''}
            placeholder="自動"
            onChange={(e) =>
              onChange({
                ...value,
                step: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    </fieldset>
  )
}

export function StylePanel({ config, onChange }: StylePanelProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex h-11 items-center border-b border-neutral-200 px-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          圖表屬性設定
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200 p-3">
          <Label className="mb-2 block">圖表類型</Label>
          <ChartTypeSelector />
        </div>

        <Accordion>
          <AccordionItem title="軸線標籤" defaultOpen>
            <AxisFields
              axis="xAxis"
              value={config.xAxis}
              onChange={(xAxis) => onChange({ ...config, xAxis })}
            />
            <AxisFields
              axis="yAxis"
              value={config.yAxis}
              onChange={(yAxis) => onChange({ ...config, yAxis })}
            />
          </AccordionItem>

          <AccordionItem title="刻度範圍">
            <AxisFields
              axis="xAxis"
              value={config.xAxis}
              onChange={(xAxis) => onChange({ ...config, xAxis })}
            />
            <AxisFields
              axis="yAxis"
              value={config.yAxis}
              onChange={(yAxis) => onChange({ ...config, yAxis })}
            />
          </AccordionItem>

          <AccordionItem title="回歸分析">
            <RegressionPanel />
          </AccordionItem>

          <AccordionItem title="誤差棒設定">
            <ErrorBarPanel />
          </AccordionItem>

          <AccordionItem title="標題與樣式">
            <div className="space-y-1.5">
              <Label htmlFor="chart-title">圖表標題</Label>
              <Input
                id="chart-title"
                value={config.title}
                onChange={(e) =>
                  onChange({ ...config, title: e.target.value })
                }
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-sm text-neutral-700">顯示網格</span>
              <input
                type="checkbox"
                checked={config.showGrid}
                onChange={(e) =>
                  onChange({ ...config, showGrid: e.target.checked })
                }
                className="h-4 w-4 accent-neutral-900"
              />
            </label>
            <div className="pt-2">
              <ThemePresets />
            </div>
          </AccordionItem>

          <AccordionItem title="進階樣式">
            <ChartStyleEditor />
          </AccordionItem>

          <AccordionItem title="匯出圖表">
            <ExportPanel />
          </AccordionItem>

          <AccordionItem title="專案存檔">
            <ProjectPanel />
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  )
}
