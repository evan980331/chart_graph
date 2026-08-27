import { useState } from 'react'
import { Plus, Trash2, Table2, X, Columns3, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChartStore } from '@/stores/useChartStore'

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function DataGrid() {
  const rawData = useChartStore((s) => s.rawData)
  const columns = useChartStore((s) => s.columns)
  const updateRawData = useChartStore((s) => s.updateRawData)
  const addRow = useChartStore((s) => s.addRow)
  const removeRow = useChartStore((s) => s.removeRow)
  const addColumn = useChartStore((s) => s.addColumn)
  const removeColumn = useChartStore((s) => s.removeColumn)
  const clearData = useChartStore((s) => s.clearData)
  const [newColName, setNewColName] = useState('')

  if (rawData.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-neutral-400">
        <Table2 className="h-8 w-8" />
        <p className="text-sm">尚無數據，請先匯入或貼上</p>
      </div>
    )
  }

  function handleAddColumn() {
    const name = newColName.trim()
    if (!name) return
    addColumn(name)
    setNewColName('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          新增行
        </Button>
        <div className="flex items-center gap-1">
          <Input
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="新欄位名"
            className="h-8 w-28 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddColumn()
            }}
          />
          <Button size="sm" variant="secondary" onClick={handleAddColumn}>
            <Columns3 className="h-3.5 w-3.5" />
            新增欄
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={clearData}>
          <Eraser className="h-3.5 w-3.5" />
          清空
        </Button>
        <span className="ml-auto text-xs text-neutral-400">
          {rawData.length} 筆 × {columns.length} 欄
        </span>
      </div>

      <div className="max-h-full overflow-auto rounded-md border border-neutral-200">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50">
              <th className="w-8 border-b border-r border-neutral-200 px-2 py-1.5 text-left font-medium text-neutral-500">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="group border-b border-r border-neutral-200 px-2 py-1.5 text-left font-medium text-neutral-700 last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{col}</span>
                    <button
                      type="button"
                      onClick={() => removeColumn(col)}
                      className="hidden shrink-0 rounded p-0.5 text-neutral-300 hover:bg-red-50 hover:text-red-600 group-hover:inline-block"
                      aria-label={`刪除欄位 ${col}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-10 border-b border-neutral-200 px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rawData.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-neutral-50/50">
                <td className="border-b border-neutral-100 px-2 py-0.5 text-neutral-400">
                  {i + 1}
                </td>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="border-b border-r border-neutral-100 px-0.5 py-0.5 last:border-r-0"
                  >
                    <input
                      value={formatCell(row[col])}
                      onChange={(e) => {
                        const num = Number(e.target.value)
                        const next = { ...row }
                        next[col] =
                          e.target.value === ''
                            ? null
                            : !Number.isNaN(num)
                              ? num
                              : e.target.value
                        const rows = rawData.map((r, idx) =>
                          idx === i ? next : r,
                        )
                        updateRawData(rows)
                      }}
                      className="h-7 w-full rounded bg-transparent px-1.5 text-xs text-neutral-800 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                    />
                  </td>
                ))}
                <td className="border-b border-neutral-100 px-0.5 py-0.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="rounded p-1 text-neutral-300 hover:bg-red-50 hover:text-red-600"
                    aria-label="刪除列"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
