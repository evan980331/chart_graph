import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import { extractColumns, type RawRow } from '@/utils/fileParser'
import { mockChartConfig, mockData } from '@/constants/mockData'
import type { ChartConfig, ChartType, ColumnMapping } from '@/types/chart'
import {
  DEFAULT_ERROR_BAR_CONFIG,
  DEFAULT_REGRESSION,
  type ErrorBarConfig,
  type RegressionSettings,
} from '@/types/analysis'
import {
  DEFAULT_STYLE_CONFIG,
  type ChartStyleConfig,
} from '@/types/style'

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
  styleConfig: ChartStyleConfig
  previewSize: { width: number; height: number } | null

  setPreviewSize: (size: { width: number; height: number } | null) => void
  importRows: (rows: RawRow[]) => void
  updateRawData: (rows: RawRow[]) => void
  setMapping: (mapping: ColumnMapping) => void
  setChartType: (type: ChartType) => void
  setConfig: (config: ChartConfig) => void
  setRegression: (settings: RegressionSettings) => void
  setErrorBar: (config: ErrorBarConfig) => void
  setStyleConfig: (config: ChartStyleConfig) => void
  addRow: () => void
  removeRow: (index: number) => void
  addColumn: (name: string) => void
  removeColumn: (name: string) => void
  clearData: () => void
  updateInvalidCount: (rows: RawRow[], mapping: ColumnMapping) => void

  resetProject: () => void
  loadProject: (partial: ProjectPayload) => void
}

/** 可序列化、可被持久化/匯出的專案子集 */
export interface ProjectPayload {
  rawData: RawRow[]
  mapping: ColumnMapping
  chartType: ChartType
  config: ChartConfig
  regression: RegressionSettings
  errorBar: ErrorBarConfig
  styleConfig: ChartStyleConfig
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

/** zundo 只追蹤可回復的狀態欄位，排除 function 與無關欄位 */
function partializeHistory(state: ChartStore) {
  return {
    rawData: state.rawData,
    columns: state.columns,
    mapping: state.mapping,
    chartType: state.chartType,
    config: state.config,
    regression: state.regression,
    errorBar: state.errorBar,
    styleConfig: state.styleConfig,
  }
}

export const useChartStore = create<ChartStore>()(
  persist(
    temporal(
      (set, get) => ({
        rawData: INITIAL_ROWS,
        columns: extractColumns(INITIAL_ROWS),
        mapping: INITIAL_MAPPING,
        chartType: 'scatter',
        config: mockChartConfig,
        invalidCount: 0,
        regression: DEFAULT_REGRESSION,
        errorBar: DEFAULT_ERROR_BAR_CONFIG,
        styleConfig: DEFAULT_STYLE_CONFIG,
        previewSize: null,

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
        setStyleConfig: (styleConfig) => set({ styleConfig }),

        addRow: () => {
          const row: RawRow = {}
          get().columns.forEach((col) => (row[col] = null))
          get().updateRawData([...get().rawData, row])
        },

        removeRow: (index) => {
          const rows = get().rawData.filter((_, i) => i !== index)
          get().updateRawData(rows)
        },

        addColumn: (name: string) => {
          const trimmed = name.trim()
          if (!trimmed || get().columns.includes(trimmed)) return
          const rows = get().rawData.map((row) => ({ ...row, [trimmed]: null }))
          get().updateRawData(rows)
        },

        removeColumn: (name: string) => {
          const rows = get().rawData.map((row) => {
            const next = { ...row }
            delete next[name]
            return next
          })
          const current = get().mapping
          const mapping: ColumnMapping = {
            xAxis: current.xAxis === name ? '' : current.xAxis,
            yAxis: current.yAxis === name ? '' : current.yAxis,
            xError: current.xError === name ? undefined : current.xError,
            yError: current.yError === name ? undefined : current.yError,
          }
          set({ mapping })
          get().updateRawData(rows)
        },

        clearData: () => {
          set({ rawData: [], columns: [], mapping: EMPTY_MAPPING, invalidCount: 0 })
        },

        setPreviewSize: (size) => set({ previewSize: size }),

        updateInvalidCount: (rows: RawRow[], mapping: ColumnMapping) => {
          const count = rows.filter((row) => {
            const x = toNumber(row[mapping.xAxis])
            const y = toNumber(row[mapping.yAxis])
            return x === null || y === null
          }).length
          set({ invalidCount: count })
        },

        resetProject: () => {
          set({
            rawData: [],
            columns: [],
            mapping: EMPTY_MAPPING,
            chartType: 'scatter',
            config: mockChartConfig,
            invalidCount: 0,
            regression: DEFAULT_REGRESSION,
            errorBar: DEFAULT_ERROR_BAR_CONFIG,
            styleConfig: DEFAULT_STYLE_CONFIG,
            previewSize: null,
          })
        },

        loadProject: (partial) => {
          const columns = extractColumns(partial.rawData)
          set({
            rawData: partial.rawData,
            columns,
            mapping: partial.mapping,
            chartType: partial.chartType,
            config: partial.config,
            regression: partial.regression,
            errorBar: partial.errorBar,
            styleConfig: partial.styleConfig,
          })
          get().updateInvalidCount(partial.rawData, partial.mapping)
        },
      }),
      {
        limit: 50,
        partialize: partializeHistory,
      },
    ),
    {
      name: 'labplot-project',
      partialize: (state) => ({
        rawData: state.rawData,
        mapping: state.mapping,
        chartType: state.chartType,
        config: state.config,
        regression: state.regression,
        errorBar: state.errorBar,
        styleConfig: state.styleConfig,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ChartStore> | undefined
        const rawData = Array.isArray(p?.rawData) ? p.rawData : current.rawData
        return {
          ...current,
          ...p,
          rawData,
          columns: extractColumns(rawData),
          mapping: p?.mapping ?? current.mapping,
        }
      },
    },
  ),
)

/** 方便元件使用的 undo/redo API */
export function useUndoRedo() {
  const temporalStore = useChartStore.temporal
  const [pastStates, setPast] = useState(temporalStore.getState().pastStates)
  const [futureStates, setFuture] = useState(temporalStore.getState().futureStates)

  useEffect(() => {
    return temporalStore.subscribe((s) => {
      setPast(s.pastStates)
      setFuture(s.futureStates)
    })
  }, [temporalStore])

  return {
    undo: () => temporalStore.getState().undo(),
    redo: () => temporalStore.getState().redo(),
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  }
}

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
