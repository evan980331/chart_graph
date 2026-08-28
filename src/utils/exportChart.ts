import Plotly from 'plotly.js-dist-min'

const GRAPH_DIV_IDS = ['labplot-chart', 'labplot-chart-mobile']

export interface ExportOptions {
  format: 'png' | 'svg'
  width?: number
  height?: number
  scale?: number
}

function deepClone<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    try {
      return JSON.parse(JSON.stringify(value)) as T
    } catch {
      return value
    }
  }
}

/** 選取目前可見的圖表節點（桌面或手機版，避免使用隱藏的那個） */
function getVisibleChart(): HTMLElement | null {
  for (const id of GRAPH_DIV_IDS) {
    const el = document.getElementById(id)
    if (el && el.offsetParent !== null) return el
  }
  for (const id of GRAPH_DIV_IDS) {
    const el = document.getElementById(id)
    if (el) return el
  }
  return null
}

export async function exportChartAsDataUrl(
  options: ExportOptions,
): Promise<string | null> {
  const src = getVisibleChart()
  if (!src) return null

  // 讀取即時圖表的 data / layout（一定反映當下標題、軸名稱、字級）
  const gd = src as unknown as {
    data?: Plotly.Data[]
    layout?: Partial<Plotly.Layout>
    _fullLayout?: { width?: number; height?: number }
  }
  const liveData = gd.data
  const liveLayout = gd.layout
  if (!liveData || !liveLayout) return null

  const data = deepClone(liveData)
  const layout = deepClone(liveLayout)

  // 匯出尺寸 = 預覽圖表實際渲染尺寸，確保與預覽一致
  const fl = gd._fullLayout as { width?: number; height?: number } | undefined
  const width = Math.round(fl?.width ?? options.width ?? 800)
  const height = Math.round(fl?.height ?? options.height ?? 600)

  // 建立臨時容器（off-screen，給足尺寸避免裁切）
  const tempDiv = document.createElement('div')
  tempDiv.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px`
  document.body.appendChild(tempDiv)

  try {
    const exportLayout = layout as Record<string, unknown>
    exportLayout.width = width
    exportLayout.height = height
    exportLayout.autosize = false

    // 確保標題有足夠空間
    if (exportLayout.title) {
      const titleFont = (exportLayout.title as Record<string, unknown>)?.font
      const titleFontSize =
        titleFont && typeof titleFont === 'object'
          ? (titleFont as Record<string, unknown>)?.size
          : undefined
      const existingT =
        typeof (exportLayout.margin as Record<string, unknown>)?.t === 'number'
          ? ((exportLayout.margin as Record<string, unknown>).t as number)
          : 0
      const t = Math.max(
        existingT,
        typeof titleFontSize === 'number' ? titleFontSize + 40 : 120,
      )
      const existingMargin =
        (exportLayout.margin as Record<string, unknown>) || {}
      exportLayout.margin = { ...existingMargin, t }
    }

    await Plotly.newPlot(
      tempDiv,
      data,
      exportLayout as Partial<Plotly.Layout>,
      {
        displayModeBar: false,
        staticPlot: false,
        responsive: false,
      },
    )

    const dataUrl = await Plotly.toImage(tempDiv, {
      format: options.format,
      width,
      height,
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
