import { useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import { useChartStore } from '@/stores/useChartStore'
import {
  exportChartAsDataUrl,
  downloadDataUrl,
} from '@/utils/exportChart'

type Format = 'png' | 'svg'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function defaultFileName(ext: string): string {
  const d = new Date()
  return `實驗_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${ext}`
}

export function ExportPanel() {
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState(3)
  const [filename, setFilename] = useState(defaultFileName('png'))
  const [loading, setLoading] = useState(false)
  const previewSize = useChartStore((s) => s.previewSize)

  function handleFormatChange(f: Format) {
    setFormat(f)
    setFilename((prev) => {
      const base = prev.replace(/\.(png|svg)$/i, '')
      return `${base}.${f}`
    })
  }

  const doExport = useCallback(async () => {
    setLoading(true)
    try {
      const dataUrl = await exportChartAsDataUrl({
        format,
        scale,
      })
      if (!dataUrl) {
        toast('找不到圖表，請先建立數據', 'error')
        return
      }
      const finalName = (filename.trim() || defaultFileName(format)).replace(
        /\.(png|svg)$/i,
        '',
      )
      downloadDataUrl(dataUrl, `${finalName}.${format}`)
      toast(`已匯出 ${finalName}.${format}`, 'success')
    } catch (err) {
      console.error('[Export] 匯出失敗：', err)
      toast('匯出失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }, [format, scale, filename])

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

      <div className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        匯出尺寸 = 預覽圖表尺寸
        {previewSize
          ? `（${previewSize.width} × ${previewSize.height}px）`
          : '（自適應）'}
        {format === 'png' && previewSize
          ? `，以 ${scale}× 輸出 = ${previewSize.width * scale} × ${previewSize.height * scale}px`
          : ''}
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
