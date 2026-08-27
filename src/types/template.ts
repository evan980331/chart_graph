import type { RawRow } from '@/utils/fileParser'
import type { ChartConfig, ChartType, ColumnMapping } from '@/types/chart'
import type { ChartStyleConfig } from '@/types/style'
import type { ErrorBarConfig, RegressionSettings } from '@/types/analysis'

export type Subject = 'physics' | 'chemistry' | 'biology' | 'earth'

export interface TemplateConfig {
  id: string
  title: string
  subject: Subject
  description: string
  /** 簡短標籤，例如：含誤差棒、線性擬合、過原點 */
  tags: string[]
  icon: string
  data: RawRow[]
  mapping: ColumnMapping
  chartType: ChartType
  config: ChartConfig
  regression: RegressionSettings
  errorBar: ErrorBarConfig
  styleConfig: ChartStyleConfig
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  physics: '物理',
  chemistry: '化學',
  biology: '生物',
  earth: '地科',
}

export const SUBJECT_ORDER: Subject[] = ['physics', 'chemistry', 'biology', 'earth']
