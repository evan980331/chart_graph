import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  ClipboardPaste,
  FileUp,
  Plus,
  Trash2,
  Table2,
  UploadCloud,
  Eraser,
  X,
  Columns3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { useChartStore } from '@/stores/useChartStore'
import {
  parseCSV,
  parseExcel,
  parseTxt,
  parsePastedText,
  type RawRow,
} from '@/utils/fileParser'

type Tab = 'input' | 'grid'

export function DataImporter() {
  const rawData = useChartStore((s) => s.rawData)
  const columns = useChartStore((s) => s.columns)
  const importRows = useChartStore((s) => s.importRows)
  const updateRawData = useChartStore((s) => s.updateRawData)
  const addRow = useChartStore((s) => s.addRow)
  const removeRow = useChartStore((s) => s.removeRow)
  const addColumn = useChartStore((s) => s.addColumn)
  const removeColumn = useChartStore((s) => s.removeColumn)
  const clearData = useChartStore((s) => s.clearData)

  const [tab, setTab] = useState<Tab>('input')
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [newColName, setNewColName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleParsed(rows: RawRow[], source: string) {
    if (rows.length === 0) {
      setError(`「${source}」未解析到任何有效數據`)
      return
    }
    setError(null)
    importRows(rows)
    setTab('grid')
    setPasteText('')
  }

  async function handleFile(file: File) {
    try {
      if (file.name.endsWith('.csv')) {
        handleParsed(await parseCSV(file), file.name)
      } else if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      ) {
        handleParsed(await parseExcel(file), file.name)
      } else if (file.name.endsWith('.txt')) {
        handleParsed(await parseTxt(file), file.name)
      } else {
        setError('僅支援 .csv、.xlsx 或 .txt 檔案')
      }
    } catch (e) {
      setError(`解析失敗：${(e as Error).message}`)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  function onPaste() {
    const rows = parsePastedText(pasteText)
    handleParsed(rows, '貼上內容')
  }

  function handleAddColumn() {
    const name = newColName.trim()
    if (!name) return
    addColumn(name)
    setNewColName('')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex gap-1 border-b border-neutral-200 p-2">
        {(
          [
            { id: 'input', label: '匯入 / 貼上', icon: <UploadCloud className="h-3.5 w-3.5" /> },
            { id: 'grid', label: '數據表格', icon: <Table2 className="h-3.5 w-3.5" /> },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              tab === t.id
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'input' ? (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={onInputChange}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-neutral-50 text-neutral-500 transition-colors',
                dragOver
                  ? 'border-neutral-500 bg-neutral-100 text-neutral-700'
                  : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100',
              )}
            >
              <FileUp className="h-6 w-6" />
              <span className="text-xs">
                拖曳 .csv / .xlsx / .txt 檔案至此處，或點擊選擇
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                <ClipboardPaste className="h-3.5 w-3.5" />
                貼上 Excel 複製的數據
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'時間\t位移\ty誤差\n0.1\t0.05\t0.02\n0.2\t0.20\t0.02'}
                className="h-32 w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-900 shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!pasteText.trim()}
                onClick={onPaste}
              >
                解析貼上內容
              </Button>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">
                <X className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <DataGrid
            rawData={rawData}
            columns={columns}
            onCellChange={(rowIndex, col, value) => {
              const rows = rawData.map((r, i) => {
                if (i !== rowIndex) return r
                const num = Number(value)
                const next = { ...r }
                next[col] = value === '' ? null : !Number.isNaN(num) ? num : value
                return next
              })
              updateRawData(rows)
            }}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            onRemoveColumn={removeColumn}
            onClear={clearData}
            newColName={newColName}
            onNewColNameChange={setNewColName}
            onAddColumn={handleAddColumn}
          />
        )}
      </div>
    </div>
  )
}

interface DataGridProps {
  rawData: RawRow[]
  columns: string[]
  onCellChange: (rowIndex: number, col: string, value: string) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  onRemoveColumn: (name: string) => void
  onClear: () => void
  newColName: string
  onNewColNameChange: (v: string) => void
  onAddColumn: () => void
}

function DataGrid({
  rawData,
  columns,
  onCellChange,
  onAddRow,
  onRemoveRow,
  onRemoveColumn,
  onClear,
  newColName,
  onNewColNameChange,
  onAddColumn,
}: DataGridProps) {
  if (rawData.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-neutral-400">
        <Table2 className="h-8 w-8" />
        <p className="text-sm">尚無數據，請先匯入或貼上</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onAddRow}>
          <Plus className="h-3.5 w-3.5" />
          新增行
        </Button>
        <div className="flex items-center gap-1">
          <Input
            value={newColName}
            onChange={(e) => onNewColNameChange(e.target.value)}
            placeholder="新欄位名"
            className="h-8 w-28 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddColumn()
            }}
          />
          <Button size="sm" variant="secondary" onClick={onAddColumn}>
            <Columns3 className="h-3.5 w-3.5" />
            新增欄
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <Eraser className="h-3.5 w-3.5" />
          清空
        </Button>
        <span className="ml-auto text-xs text-neutral-400">
          {rawData.length} 筆 × {columns.length} 欄
        </span>
      </div>

      <div className="max-h-80 overflow-auto rounded-md border border-neutral-200">
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
                      onClick={() => onRemoveColumn(col)}
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
                      onChange={(e) => onCellChange(i, col, e.target.value)}
                      className="h-7 w-full rounded bg-transparent px-1.5 text-xs text-neutral-800 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                    />
                  </td>
                ))}
                <td className="border-b border-neutral-100 px-0.5 py-0.5 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(i)}
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

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}
