import { DataImporter } from '@/components/data/DataImporter'
import { ColumnMapper } from '@/components/data/ColumnMapper'

export function DataPanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-11 shrink-0 items-center border-b border-neutral-200 px-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          實驗數據輸入
        </h2>
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
