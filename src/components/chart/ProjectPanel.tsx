import { useRef, useState } from 'react'
import {
  FolderOpen,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import {
  useChartStore,
  type ProjectPayload,
} from '@/stores/useChartStore'

/** .labplot 專案檔格式版本 */
const PROJECT_VERSION = 1

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isValidPayload(p: unknown): p is ProjectPayload {
  if (!isPlainObject(p)) return false
  return (
    Array.isArray(p.rawData) &&
    isPlainObject(p.mapping) &&
    typeof p.chartType === 'string' &&
    isPlainObject(p.config) &&
    isPlainObject(p.regression) &&
    isPlainObject(p.errorBar) &&
    isPlainObject(p.styleConfig)
  )
}

export function ProjectPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const loadProject = useChartStore((s) => s.loadProject)
  const resetProject = useChartStore((s) => s.resetProject)

  function buildPayload(): ProjectPayload {
    const s = useChartStore.getState()
    return {
      rawData: s.rawData,
      mapping: s.mapping,
      chartType: s.chartType,
      config: s.config,
      regression: s.regression,
      errorBar: s.errorBar,
      styleConfig: s.styleConfig,
    }
  }

  function downloadBlob(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function defaultProjectName(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `專案_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.labplot`
  }

  async function handleExport() {
    setExporting(true)
    try {
      const payload = buildPayload()
      const doc = JSON.stringify(
        {
          format: 'labplot',
          version: PROJECT_VERSION,
          createdAt: new Date().toISOString(),
          state: payload,
        },
        null,
        2,
      )
      // 讓出主執行緒，使 loading 狀態能先渲染
      await new Promise((r) => setTimeout(r, 50))
      downloadBlob(doc, defaultProjectName())
      toast('已匯出 .labplot 專案檔', 'success')
    } catch (err) {
      console.error('[Project] 匯出失敗：', err)
      toast('專案匯出失敗', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        toast('檔案內容不是有效的 JSON', 'error')
        return
      }

      const state = isPlainObject(parsed) ? parsed.state : parsed
      if (!isValidPayload(state)) {
        toast('檔案結構無效，無法匯入', 'error')
        return
      }

      loadProject(state)
      toast('已匯入專案', 'success')
    } catch (err) {
      console.error('[Project] 匯入失敗：', err)
      toast('專案匯入失敗', 'error')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleReset() {
    const ok = window.confirm(
      '確定要清空目前專案嗎？所有數據與設定將還原為初始狀態，且無法復原。',
    )
    if (!ok) return
    resetProject()
    toast('已清空專案', 'info')
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          匯出專案
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
          )}
          開啟舊檔
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".labplot,application/json"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      <p className="text-[10px] leading-relaxed text-neutral-400">
        專案會自動暫存於本機瀏覽器，重新整理後數據不遺失。可匯出 .labplot 檔攜帶或備份。
      </p>

      <Button
        size="sm"
        variant="outline"
        onClick={handleReset}
        className="w-full border-red-200 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        清空專案
      </Button>
    </div>
  )
}
