import { Download, FileUp, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onImport?: () => void
  onExport?: () => void
}

export function Header({ onImport, onExport }: HeaderProps) {
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
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 ring-1 ring-inset ring-neutral-200">
            v0.1.0 Alpha
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <FileUp className="h-4 w-4" />
          匯入檔
        </Button>
        <Button variant="default" size="sm" onClick={onExport}>
          <Download className="h-4 w-4" />
          匯出圖表
        </Button>
      </div>
    </header>
  )
}
