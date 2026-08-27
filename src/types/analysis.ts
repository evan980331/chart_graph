import type { ErrorSource, RegressionType } from '@/utils/mathStats'

export type { ErrorSource, RegressionType }

export interface RegressionSettings {
  enabled: boolean
  type: RegressionType
  forceZeroIntercept: boolean
  lineStyle: 'solid' | 'dashed' | 'dotted'
  lineColor: string
  lineWidth: number
}

export const DEFAULT_REGRESSION: RegressionSettings = {
  enabled: false,
  type: 'linear',
  forceZeroIntercept: false,
  lineStyle: 'solid',
  lineColor: '#000000',
  lineWidth: 1.5,
}

export interface AxisErrorBarSettings {
  source: ErrorSource
  value: number
  direction: 'both' | 'plus' | 'minus'
  color: string
  capSize: number
  thickness: number
}

export const DEFAULT_ERROR_BAR: AxisErrorBarSettings = {
  source: 'field',
  value: 5,
  direction: 'both',
  color: '#000000',
  capSize: 4,
  thickness: 1,
}

export interface ErrorBarConfig {
  x: AxisErrorBarSettings
  y: AxisErrorBarSettings
}

export const DEFAULT_ERROR_BAR_CONFIG: ErrorBarConfig = {
  x: { ...DEFAULT_ERROR_BAR },
  y: { ...DEFAULT_ERROR_BAR },
}
