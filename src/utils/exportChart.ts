import Plotly from 'plotly.js-dist-min'

const GRAPH_DIV_ID = 'labplot-chart'

export interface ExportOptions {
  format: 'png' | 'svg'
  width: number
  height: number
  scale?: number
}

/** 深拷貝 trace 的可序列化屬性，排除 Plotly 內部物件 */
function cloneTrace(trace: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(trace)) {
    const val = trace[key]
    if (val === null || val === undefined) {
      out[key] = val
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      // 只拷貝 plain object
      try {
        out[key] = JSON.parse(JSON.stringify(val))
      } catch {
        // 跳過不可序列化的屬性
      }
    } else if (Array.isArray(val)) {
      try {
        out[key] = JSON.parse(JSON.stringify(val))
      } catch {
        // 跳過
      }
    } else {
      out[key] = val
    }
  }
  return out
}

export async function exportChartAsDataUrl(
  options: ExportOptions,
): Promise<string | null> {
  const src = document.getElementById(GRAPH_DIV_ID)
  if (!src) return null

  const gd = src as unknown as Record<string, unknown>
  const fullData = gd._fullData as Record<string, unknown>[] | undefined
  const fullLayout = gd._fullLayout as Record<string, unknown> | undefined

  if (!fullData || !fullLayout) return null

  // 建立臨時容器
  const tempDiv = document.createElement('div')
  tempDiv.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden'
  document.body.appendChild(tempDiv)

  try {
    // 深拷貝 traces
    const traces = fullData.map(cloneTrace)

    // 深拷貝 layout 並覆蓋尺寸
    let layout: Record<string, unknown>
    try {
      layout = JSON.parse(JSON.stringify(fullLayout))
    } catch {
      layout = {}
    }
    layout.width = options.width
    layout.height = options.height
    layout.autosize = false
    // 確保標題有足夠空間：margin.t = 字級 + 上下留白 30px
    if (layout.title) {
      const titleFontSize =
        (layout.title as Record<string, unknown>)?.font &&
        typeof (layout.title as Record<string, unknown>).font === 'object'
          ? ((layout.title as Record<string, unknown>).font as Record<string, unknown>)?.size
          : undefined
      const t = typeof titleFontSize === 'number' ? titleFontSize + 40 : 120
      const existingMargin = (layout.margin as Record<string, unknown>) || {}
      layout.margin = { ...existingMargin, t }
    }

    await Plotly.newPlot(tempDiv, traces, layout as Partial<Plotly.Layout>, {
      displayModeBar: false,
      staticPlot: false,
      responsive: false,
    })

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
