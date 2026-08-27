import Plotly from 'plotly.js-dist-min'

const GRAPH_DIV_ID = 'labplot-chart'

export interface ExportOptions {
  format: 'png' | 'svg'
  width: number
  height: number
  scale?: number
}

/**
 * 匯出圖表到 data URL，不影響預覽圖表。
 * 用臨時 div 重建完整 Plotly 圖表後截圖。
 */
export async function exportChartAsDataUrl(
  options: ExportOptions,
): Promise<string | null> {
  const src = document.getElementById(GRAPH_DIV_ID)
  if (!src) return null

  const gd = src as unknown as {
    _fullData?: Plotly.Data[]
    _fullLayout?: Partial<Plotly.Layout>
  }

  if (!gd._fullData || !gd._fullLayout) return null

  // 建立臨時隱藏容器
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'fixed'
  tempDiv.style.left = '-9999px'
  tempDiv.style.top = '-9999px'
  tempDiv.style.width = `${options.width}px`
  tempDiv.style.height = `${options.height}px`
  document.body.appendChild(tempDiv)

  try {
    // 用匯出尺寸重建圖表
    const exportLayout: Partial<Plotly.Layout> = {
      ...gd._fullLayout,
      width: options.width,
      height: options.height,
      autosize: false,
    }

    await Plotly.newPlot(tempDiv, gd._fullData ?? [], exportLayout, {
      displayModeBar: false,
      staticPlot: false,
    })

    const dataUrl = await Plotly.toImage(tempDiv, {
      format: options.format,
      width: options.width,
      height: options.height,
      scale: options.format === 'png' ? (options.scale ?? 2) : undefined,
    })

    return dataUrl
  } finally {
    // 清理
    await Plotly.purge(tempDiv)
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
