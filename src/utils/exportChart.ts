import Plotly from 'plotly.js-dist-min'
import { getChartSnapshot } from '@/utils/chartSnapshot'

export interface ExportOptions {
  format: 'png' | 'svg'
  width: number
  height: number
  scale?: number
}

export async function exportChartAsDataUrl(
  options: ExportOptions,
): Promise<string | null> {
  const snapshot = getChartSnapshot()
  if (!snapshot) return null

  const { data, layout } = snapshot

  // 建立臨時容器（off-screen，給足尺寸避免裁切）
  const tempDiv = document.createElement('div')
  tempDiv.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${options.width}px;height:${options.height}px`
  document.body.appendChild(tempDiv)

  try {
    // 深拷貝 layout 並覆寫尺寸
    let exportLayout: Record<string, unknown>
    try {
      exportLayout = JSON.parse(JSON.stringify(layout))
    } catch {
      exportLayout = { ...layout }
    }

    exportLayout.width = options.width
    exportLayout.height = options.height
    exportLayout.autosize = false

    // 確保標題有足夠空間
    if (exportLayout.title) {
      const titleFont =
        (exportLayout.title as Record<string, unknown>)?.font
      const titleFontSize =
        titleFont && typeof titleFont === 'object'
          ? (titleFont as Record<string, unknown>)?.size
          : undefined
      const t =
        Math.max(
          typeof (exportLayout.margin as Record<string, unknown>)?.t === 'number'
            ? ((exportLayout.margin as Record<string, unknown>).t as number)
            : 0,
          typeof titleFontSize === 'number' ? titleFontSize + 40 : 120,
        )
      const existingMargin =
        (exportLayout.margin as Record<string, unknown>) || {}
      exportLayout.margin = { ...existingMargin, t }
    }

    // 深拷貝 traces
    let exportData: Plotly.Data[]
    try {
      exportData = JSON.parse(JSON.stringify(data))
    } catch {
      exportData = data
    }

    await Plotly.newPlot(
      tempDiv,
      exportData,
      exportLayout as Partial<Plotly.Layout>,
      {
        displayModeBar: false,
        staticPlot: false,
        responsive: false,
      },
    )

    const dataUrl = await Plotly.toImage(tempDiv, {
      format: options.format,
      width: options.width,
      height: options.height,
      scale: options.format === 'png' ? (options.scale ?? 2) : undefined,
    })

    return dataUrl
  } finally {
    try {
      Plotly.purge(tempDiv)
    } catch {
      // 忽略清理錯誤
    }
    document.body.removeChild(tempDiv)
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
