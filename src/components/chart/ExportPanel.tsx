import { useMemo, useState, useCallback } from 'react'
import Plotly from 'plotly.js-dist-min'
import { Download, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useChartStore } from '@/stores/useChartStore'
import { toast } from '@/utils/toast'
import { resolveFontFamily } from '@/types/style'

type Format = 'png' | 'svg'

const GRAPH_DIV_ID = 'labplot-chart'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function defaultFileName(ext: string): string {
  const d = new Date()
  return `實驗_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${ext}`
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function ExportPanel() {
  const [format, setFormat] = useState<Format>('png')
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(800)
  const [scale, setScale] = useState(3)
  const [filename, setFilename] = useState(defaultFileName('png'))
  const [loading, setLoading] = useState(false)

  const styleConfig = useChartStore((s) => s.styleConfig)

  const family = useMemo(() => resolveFontFamily(styleConfig.font), [styleConfig.font])

  function handleFormatChange(f: Format) {
    setFormat(f)
    setFilename((prev) => {
      const base = prev.replace(/\.(png|svg)$/i, '')
      return `${base}.${f}`
    })
  }

  const doExport = useCallback(async () => {
    const div = document.getElementById(GRAPH_DIV_ID)
    if (!div) {
      toast('找不到圖表，請先建立數據', 'error')
      return
    }

    const finalName = (filename.trim() || defaultFileName(format)).replace(
      /\.(png|svg)$/i,
      '',
    )

    setLoading(true)
    try {
      ;(div as HTMLElement).style.fontFamily = family
      // 先用 relayout 設定匯出尺寸，確保標題不被裁切
      const gd = div as unknown as { _fullLayout?: { title?: { text?: string } } }
      const hasTitle = !!gd._fullLayout?.title?.text
      const extraTop = hasTitle ? 40 : 0

      await Plotly.relayout(div, {
        width,
        height,
        margin: { l: 70, r: 40, t: 60 + extraTop, b: 60 },
      } as Partial<Plotly.Layout>)

      const dataUrl = await Plotly.toImage(div as HTMLElement, {
        format,
        width,
        height,
        scale: format === 'png' ? scale : undefined,
      })

      // 還原為自動尺寸
      await Plotly.relayout(div, {
        width: undefined,
        height: undefined,
        margin: { l: 70, r: 40, t: 60 + extraTop, b: 60 },
      } as Partial<Plotly.Layout>)

      downloadDataUrl(dataUrl, `${finalName}.${format}`)
      toast(`已匯出 ${finalName}.${format}`, 'success')
    } catch (err) {
      console.error('[Export] 匯出失敗：', err)
      toast('匯出失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }, [format, width, height, scale, filename, family])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="export-format">格式</Label>
          <Select
            id="export-format"
            value={format}
            onChange={(e) => handleFormatChange(e.target.value as Format)}
          >
            <option value="png">PNG（高解析度）</option>
            <option value="svg">SVG（無損向量）</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="export-filename">檔名</Label>
          <Input
            id="export-filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField id="export-width" label="寬度 (px)" value={width} min={64} onChange={setWidth} />
        <NumberField id="export-height" label="高度 (px)" value={height} min={64} onChange={setHeight} />
      </div>

      {format === 'png' && (
        <div className="space-y-1">
          <Label htmlFor="export-scale">縮放倍率（印刷品質）</Label>
          <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={
                  scale === s
                    ? 'flex-1 rounded bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                    : 'flex-1 rounded px-2 py-1 text-xs text-neutral-500'
                }
              >
                {s}×
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-400">
            {width}×{height} 以 {scale}× 匯出 = {width * scale}×{height * scale}
          </p>
        </div>
      )}

      <Button
        onClick={doExport}
        disabled={loading}
        className="w-full"
        variant="default"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            匯出中…
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            下載圖表
          </>
        )}
      </Button>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  min,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const raw = Number(e.target.value)
          onChange(Number.isFinite(raw) && raw >= min ? raw : min)
        }}
      />
    </div>
  )
}
