export type FontFamily = 'times' | 'arial' | 'noto'
export type TickDirection = 'inside' | 'outside'
export type GridLineStyle = 'solid' | 'dashed'
export type MarkerStyle = { size: number; color: string }

export interface ChartStyleConfig {
  font: FontFamily
  fontSize: number
  tickFontSize: number
  axisColor: string
  axisWidth: number
  tickDirection: TickDirection
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  xStep?: number
  yStep?: number
  showXGrid: boolean
  showYGrid: boolean
  gridStyle: GridLineStyle
  marker: MarkerStyle
  lineWidth: number
}

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  times: 'Times New Roman, Times, serif',
  arial: 'Arial, Helvetica, sans-serif',
  noto: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
}

export function resolveFontFamily(font: FontFamily): string {
  return FONT_FAMILY_MAP[font]
}

export const DEFAULT_STYLE_CONFIG: ChartStyleConfig = {
  font: 'arial',
  fontSize: 18,
  tickFontSize: 14,
  axisColor: '#000000',
  axisWidth: 1.5,
  tickDirection: 'outside',
  showXGrid: true,
  showYGrid: true,
  gridStyle: 'solid',
  marker: { size: 8, color: '#000000' },
  lineWidth: 2,
}

/** 科展展板：粗軸線 + 大字級 + 高對比 */
export const POSTER_STYLE: Partial<ChartStyleConfig> = {
  font: 'times',
  fontSize: 18,
  tickFontSize: 16,
  axisWidth: 2,
  marker: { size: 8, color: '#000000' },
  lineWidth: 2,
}

/** 探究 / PDF 報告：標準字體 + 細軸線 + 預設關閉網格 */
export const REPORT_STYLE: Partial<ChartStyleConfig> = {
  font: 'times',
  fontSize: 14,
  tickFontSize: 12,
  axisWidth: 1,
  showXGrid: false,
  showYGrid: false,
  marker: { size: 6, color: '#000000' },
  lineWidth: 1.5,
}

/** 簡報投影片：大型數據點 + 粗擬合線 */
export const SLIDE_STYLE: Partial<ChartStyleConfig> = {
  font: 'arial',
  fontSize: 16,
  tickFontSize: 13,
  axisWidth: 1.5,
  marker: { size: 8, color: '#000000' },
  lineWidth: 2.5,
}
