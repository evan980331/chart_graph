import { useEffect, useCallback } from 'react'
import {
  Download,
  FileUp,
  FlaskConical,
  Sparkles,
  Lightbulb,
  Undo2,
  Redo2,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUndoRedo } from '@/stores/useChartStore'

interface HeaderProps {
  onImport?: () => void
  onExport?: () => void
  onTemplate?: () => void
  onFeedback?: () => void
  onFeatures?: () => void
  onChangelog?: () => void
}

export function Header({
  onImport,
  onExport,
  onTemplate,
  onFeedback,
  onFeatures,
  onChangelog,
}: HeaderProps) {
  const { undo, redo, canUndo, canRedo } = useUndoRedo()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) undo()
      }
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (canRedo) redo()
      }
      if (isMod && e.key === 'y') {
        e.preventDefault()
        if (canRedo) redo()
      }
    },
    [canUndo, canRedo, undo, redo],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white">
          <FlaskConical className="h-4.5 w-4.5" />
        </span>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-neutral-900">
            LabPlot 科學圖表生成器
          </h1>
          <button
            type="button"
            onClick={onChangelog}
            className="cursor-pointer rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            Beta v1.0
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onFeatures}>
          <Info className="h-4 w-4" />
          關於工具
        </Button>
        <Button variant="outline" size="sm" onClick={onTemplate}>
          <Sparkles className="h-4 w-4" />
          使用範本
        </Button>
        <Button variant="outline" size="sm" onClick={onImport}>
          <FileUp className="h-4 w-4" />
          匯入檔
        </Button>
        <Button variant="default" size="sm" onClick={onExport}>
          <Download className="h-4 w-4" />
          匯出圖表
        </Button>
        <div className="ml-1 flex items-center gap-1 border-l border-neutral-200 pl-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="復原 (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onFeedback}>
          <Lightbulb className="h-4 w-4" />
          問題與建議
        </Button>
      </div>
    </header>
  )
}
