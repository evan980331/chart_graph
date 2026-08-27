import { create } from 'zustand'
import { extractColumns, type RawRow } from '@/utils/fileParser'
import { mockChartConfig, mockData } from '@/constants/mockData'
import type { ChartConfig, ChartType, ColumnMapping } from '@/types/chart'
import {
  DEFAULT_ERROR_BAR_CONFIG,
  DEFAULT_REGRESSION,
  type ErrorBarConfig,
  type RegressionSettings,
} from '@/types/analysis'

export interface CleanPoint {
  x: number
  y: number
  xError?: number
  yError?: number
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null
  const num =
    typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(num) ? num : null
}

const EMPTY_MAPPING: ColumnMapping = { xAxis: '', yAxis: '' }

interface ChartStore {
  rawData: RawRow[]
  columns: string[]
  mapping: ColumnMapping
  chartType: ChartType
  config: ChartConfig
  invalidCount: number
  regression: RegressionSettings
  errorBar: ErrorBarConfig

  importRows: (rows: RawRow[]) => void
  updateRawData: (rows: RawRow[]) => void
  setMapping: (mapping: ColumnMapping) => void
  setChartType: (type: ChartType) => void
  setConfig: (config: ChartConfig) => void
  setRegression: (settings: RegressionSettings) => void
  setErrorBar: (config: ErrorBarConfig) => void
  addRow: () => void
  removeRow: (index: number) => void
  clearData: () => void
  updateInvalidCount: (rows: RawRow[], mapping: ColumnMapping) => void
}

function detectErrorColumn(columns: string[], primary: string): string | undefined {
  const lower = primary.toLowerCase()
  return columns.find((c) => {
    const cl = c.toLowerCase()
    return cl.includes('err') && (cl.includes(lower) || cl.includes('x') || cl.includes('y'))
  })
}

function inferMapping(columns: string[]): ColumnMapping {
  const [x, y] = columns
  if (!x || !y) return EMPTY_MAPPING
  return {
    xAxis: x,
    yAxis: y,
    xError: detectErrorColumn(columns, x),
    yError: detectErrorColumn(columns, y),
  }
}

const INITIAL_ROWS: RawRow[] = mockData.map((d, i) => ({
  id: `r${i + 1}`,
  x: d.x,
  y: d.y,
  yError: d.yError ?? null,
}))

const INITIAL_MAPPING: ColumnMapping = {
  xAxis: 'x',
  yAxis: 'y',
  yError: 'yError',
}

export const useChartStore = create<ChartStore>()((set, get) => ({
  rawData: INITIAL_ROWS,
  columns: extractColumns(INITIAL_ROWS),
  mapping: INITIAL_MAPPING,
  chartType: 'scatter',
  config: mockChartConfig,
  invalidCount: 0,
  regression: DEFAULT_REGRESSION,
  errorBar: DEFAULT_ERROR_BAR_CONFIG,

  importRows: (rows) => {
    const columns = extractColumns(rows)
    const mapping = inferMapping(columns)
    set({ rawData: rows, columns, mapping })
    get().updateInvalidCount(rows, mapping)
  },

  updateRawData: (rows) => {
    const columns = extractColumns(rows)
    const current = get().mapping
    const mapping: ColumnMapping = {
      xAxis: current.xAxis,
      yAxis: current.yAxis,
      xError:
        current.xError && columns.includes(current.xError)
          ? current.xError
          : undefined,
      yError:
        current.yError && columns.includes(current.yError)
          ? current.yError
          : undefined,
    }
    set({ rawData: rows, columns, mapping })
    get().updateInvalidCount(rows, mapping)
  },

  setMapping: (mapping) => {
    set({ mapping })
    get().updateInvalidCount(get().rawData, mapping)
  },

  setChartType: (chartType) => set({ chartType }),
  setConfig: (config) => set({ config }),
  setRegression: (regression) => set({ regression }),
  setErrorBar: (errorBar) => set({ errorBar }),

  addRow: () => {
    const row: RawRow = {}
    get().columns.forEach((col) => (row[col] = null))
    get().updateRawData([...get().rawData, row])
  },

  removeRow: (index) => {
    const rows = get().rawData.filter((_, i) => i !== index)
    get().updateRawData(rows)
  },

  clearData: () => {
    set({ rawData: [], columns: [], mapping: EMPTY_MAPPING, invalidCount: 0 })
  },

  updateInvalidCount: (rows: RawRow[], mapping: ColumnMapping) => {
    const count = rows.filter((row) => {
      const x = toNumber(row[mapping.xAxis])
      const y = toNumber(row[mapping.yAxis])
      return x === null || y === null
    }).length
    set({ invalidCount: count })
  },
}))

export function selectCleanData(state: ChartStore): CleanPoint[] {
  const { rawData, mapping } = state
  if (!mapping.xAxis || !mapping.yAxis) return []
  const points: CleanPoint[] = []
  for (const row of rawData) {
    const x = toNumber(row[mapping.xAxis])
    const y = toNumber(row[mapping.yAxis])
    if (x === null || y === null) continue
    const point: CleanPoint = { x, y }
    const xErr = mapping.xError ? toNumber(row[mapping.xError]) : null
    const yErr = mapping.yError ? toNumber(row[mapping.yError]) : null
    if (mapping.xError && xErr !== null) point.xError = xErr
    if (mapping.yError && yErr !== null) point.yError = yErr
    points.push(point)
  }
  return points
}
