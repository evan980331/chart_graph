import { DataGrid } from '@/components/data/DataGrid'

export function DataTablePanel() {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
      <DataGrid />
    </div>
  )
}
