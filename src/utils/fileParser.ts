import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export type RawRow = Record<string, unknown>

function trimAndFillKey(raw: string, index: number): string {
  const key = raw?.toString().trim()
  return key || `column_${index + 1}`
}

function rowsToObjects(headers: string[], rows: unknown[][]): RawRow[] {
  const result: RawRow[] = []
  for (const row of rows) {
    const isEmpty = row.every(
      (cell) => cell === undefined || cell === null || String(cell).trim() === '',
    )
    if (isEmpty) continue
    const obj: RawRow = {}
    headers.forEach((header, i) => {
      obj[header] = row[i]
    })
    result.push(obj)
  }
  return result
}

export async function parseCSV(file: File): Promise<RawRow[]> {
  const text = await file.text()
  const trimmed = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .join('\n')

  const parsed = Papa.parse<RawRow>(trimmed, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })

  return parsed.data.map((row) => {
    const clean: RawRow = {}
    Object.keys(row).forEach((key) => {
      const trimmedKey = key.trim()
      clean[trimmedKey] = row[key]
    })
    return clean
  })
}

export async function parseTxt(file: File): Promise<RawRow[]> {
  const text = await file.text()
  return parsePastedText(text)
}

export async function parseExcel(file: File): Promise<RawRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  }) as unknown[][]

  if (rows.length === 0) return []

  const headers = (rows[0] as unknown[]).map((h, i) =>
    trimAndFillKey(h as string, i),
  )
  return rowsToObjects(headers, rows.slice(1))
}

export function parsePastedText(text: string): RawRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')

  if (lines.length === 0) return []

  const firstLine = lines[0]
  const delimiter = firstLine.includes('\t') ? '\t' : ','

  const split = (line: string) =>
    line
      .split(delimiter)
      .map((cell) => cell.trim().replace(/^"|"$/g, ''))

  const headers = split(lines[0]).map(trimAndFillKey)
  const dataRows = lines.slice(1).map(split).map((row) => row.map(toCellValue))

  return rowsToObjects(headers, dataRows as unknown[][])
}

function toCellValue(raw: string): unknown {
  if (raw === '') return null
  const num = Number(raw)
  return Number.isNaN(num) ? raw : num
}

export function extractColumns(rows: RawRow[]): string[] {
  const keys = new Set<string>()
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)))
  return Array.from(keys)
}
