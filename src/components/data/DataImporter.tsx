import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  ClipboardPaste,
  FileUp,
  UploadCloud,
  X,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { useChartStore } from '@/stores/useChartStore'
import {
  parseCSV,
  parseExcel,
  parseTxt,
  parsePastedText,
  type RawRow,
} from '@/utils/fileParser'
import { DataGrid } from '@/components/data/DataGrid'

type Tab = 'input' | 'grid'

interface DataImporterProps {
  hideGridTab?: boolean
}

export function DataImporter({ hideGridTab = false }: DataImporterProps) {
  const importRows = useChartStore((s) => s.importRows)

  const [tab, setTab] = useState<Tab>('input')
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {!hideGridTab && (
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
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {hideGridTab || tab === 'input' ? (
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
          <DataGrid />
        )}
      </div>
    </div>
  )
}
