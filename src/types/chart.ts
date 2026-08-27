export interface DataRow {
  id: string
  x: number
  y: number
  xError?: number
  yError?: number
}

export interface AxisConfig {
  label: string
  unit: string
  min?: number
  max?: number
  step?: number
}

export interface ChartConfig {
  title: string
  xAxis: AxisConfig
  yAxis: AxisConfig
  showGrid: boolean
}

export type ChartType = 'scatter' | 'line' | 'bar'

export interface ColumnMapping {
  xAxis: string
  yAxis: string
  xError?: string
  yError?: string
}

