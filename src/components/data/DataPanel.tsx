import { DataImporter } from '@/components/data/DataImporter'
import { ColumnMapper } from '@/components/data/ColumnMapper'

interface DataPanelProps {
  variant?: 'sidebar' | 'bottom'
}

export function DataPanel({ variant = 'sidebar' }: DataPanelProps) {
  if (variant === 'bottom') {
    return (
      <aside className="flex h-full w-full flex-col border-t border-neutral-200 bg-white">
        <div className="flex h-11 shrink-0 items-center border-b border-neutral-200 px-4">
          <h2 className="text-sm font-semibold text-neutral-900">實驗數據輸入</h2>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <DataImporter />
          </div>
          <div className="w-72 shrink-0 overflow-y-auto border-l border-neutral-200 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              欄位對應
            </h3>
            <ColumnMapper />
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-11 shrink-0 items-center border-b border-neutral-200 px-4">
        <h2 className="text-sm font-semibold text-neutral-900">實驗數據輸入</h2>
      </div>

      <DataImporter />

      <div className="shrink-0 border-t border-neutral-200 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          欄位對應
        </h3>
        <ColumnMapper />
      </div>
    </aside>
  )
}
