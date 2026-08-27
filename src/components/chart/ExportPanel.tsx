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
import { cn } from '@/utils/cn'

type Format = 'png' | 'svg'

const GRAPH_DIV_ID = 'labplot-chart'

const FONT_SCALES = [
  { label: 'S', value: 0.8, desc: '較小' },
  { label: 'M', value: 1, desc: '原始' },
  { label: 'L', value: 1.5, desc: '較大' },
  { label: 'XL', value: 2, desc: '最大' },
] as const

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
  const [fontScale, setFontScale] = useState(1)
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

      let restoreNeeded = false
      if (fontScale !== 1) {
        const gd = div as unknown as { _fullLayout?: { title?: { font?: { size?: number } }; font?: { size?: number }; annotations?: { font?: { size?: number } }[] } }
        const fl = gd._fullLayout || {}
        const titleSize = (fl.title?.font?.size ?? styleConfig.fontSize) * fontScale
        const tickSize = (fl.font?.size ?? styleConfig.tickFontSize) * fontScale
        const annotationSize = (fl.annotations?.[0]?.font?.size ?? 12) * fontScale
        const marginL = Math.round(70 * fontScale)
        const marginR = Math.round(40 * fontScale)
        const marginT = Math.round(60 * fontScale)
        const marginB = Math.round(60 * fontScale)

        await Plotly.relayout(div, {
          title: { font: { size: titleSize } },
          font: { size: tickSize },
          margin: { l: marginL, r: marginR, t: marginT, b: marginB },
          annotations: [{ ...fl.annotations?.[0], font: { size: annotationSize } }],
        } as Partial<Plotly.Layout>)
        restoreNeeded = true
      }

      const dataUrl = await Plotly.toImage(div as HTMLElement, {
        format,
        width,
        height,
        scale: format === 'png' ? scale : undefined,
      })

      if (restoreNeeded) {
        await Plotly.relayout(div, {
          title: { font: { size: styleConfig.fontSize } },
          font: { size: styleConfig.tickFontSize },
          margin: { l: 70, r: 40, t: 60, b: 60 },
        } as Partial<Plotly.Layout>)
      }

      downloadDataUrl(dataUrl, `${finalName}.${format}`)
      toast(`已匯出 ${finalName}.${format}`, 'success')
    } catch (err) {
      console.error('[Export] 匯出失敗：', err)
      toast('匯出失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }, [format, width, height, scale, fontScale, filename, family, styleConfig])

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

      {/* 字級選擇 */}
      <div className="space-y-1">
        <Label>匯出字級</Label>
        <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
          {FONT_SCALES.map((fs) => (
            <button
              key={fs.label}
              type="button"
              onClick={() => setFontScale(fs.value)}
              className={cn(
                'flex-1 rounded px-2 py-1 text-xs transition-colors',
                fontScale === fs.value
                  ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              {fs.label}
              <span className="ml-0.5 text-[10px] text-neutral-400">{fs.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-400">
          調整匯出圖片中的文字大小，預覽圖表不受影響
        </p>
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
