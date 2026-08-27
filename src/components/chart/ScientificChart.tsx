import { useEffect, useMemo } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import {
  toNumber,
  useChartStore,
  type CleanPoint,
} from '@/stores/useChartStore'
import {
  calculateErrorBars,
  fitRegression,
  type ErrorBarSettings,
  type RegressionResult,
} from '@/utils/mathStats'
import type { AxisConfig } from '@/types/chart'
import type { AxisErrorBarSettings, RegressionSettings } from '@/types/analysis'
import {
  resolveFontFamily,
  type ChartStyleConfig,
} from '@/types/style'
import { setChartSnapshot } from '@/utils/chartSnapshot'

const Plot = createPlotlyComponent(Plotly)

function DataWarning({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {message}
    </div>
  )
}

interface ScientificChartProps {
  height?: number
}

function axisTitle(label: string, unit: string): string {
  return unit ? `${label} (${unit})` : label
}

function hasNonNull(values: (number | null)[] | null | undefined): boolean {
  return !!values && values.some((v) => v != null)
}

function buildErrorObject(
  axisValues: (number | null)[],
  fieldArray: (number | null)[] | undefined,
  settings: AxisErrorBarSettings,
): Plotly.ErrorBar | undefined {
  const out = calculateErrorBars(
    axisValues,
    { source: settings.source, value: settings.value } satisfies ErrorBarSettings,
    fieldArray,
  )

  if (!hasNonNull(out.array)) return undefined

  if (settings.direction === 'both') {
    return {
      type: 'data',
      array: out.array as number[],
      symmetric: true,
      color: settings.color,
      thickness: settings.thickness,
      width: settings.capSize,
    }
  }

  const zeros = (out.array ?? []).map(() => 0)
  if (settings.direction === 'plus') {
    return {
      type: 'data',
      symmetric: false,
      array: out.array as number[],
      arrayminus: zeros,
      color: settings.color,
      thickness: settings.thickness,
      width: settings.capSize,
    }
  }
  return {
    type: 'data',
    symmetric: false,
    array: zeros,
    arrayminus: out.array as number[],
    color: settings.color,
    thickness: settings.thickness,
    width: settings.capSize,
  }
}

const DASH_MAP: Record<RegressionSettings['lineStyle'], string> = {
  solid: 'solid',
  dashed: 'dash',
  dotted: 'dot',
}

function buildFitTrace(
  points: CleanPoint[],
  fit: RegressionResult,
  settings: RegressionSettings,
): Plotly.Data | null {
  const xs = points.map((p) => p.x)
  const xMax = Math.max(...xs)
  const xMin = Math.min(...xs)
  const span = xMax - xMin
  const samples: { x: number; y: number }[] = []
  const N = 100
  for (let i = 0; i <= N; i++) {
    const x = span === 0 ? xMin : xMin + (i / N) * span
    const y = fit.predict(x)
    if (y != null && Number.isFinite(y)) samples.push({ x, y })
  }
  if (samples.length === 0) return null

  return {
    type: 'scatter',
    mode: 'lines',
    x: samples.map((s) => s.x),
    y: samples.map((s) => s.y),
    line: {
      color: settings.lineColor,
      width: settings.lineWidth,
      dash: DASH_MAP[settings.lineStyle],
    },
    name: `${fit.formula}  (R² = ${formatR2(fit.r2)})`,
    showlegend: true,
    hoverinfo: 'skip',
  }
}

function formatR2(r2: number): string {
  if (Number.isNaN(r2)) return 'N/A'
  return r2.toFixed(4)
}

export function ScientificChart({ height = 480 }: ScientificChartProps) {
  const config = useChartStore((s) => s.config)
  const chartType = useChartStore((s) => s.chartType)
  const regression = useChartStore((s) => s.regression)
  const errorBar = useChartStore((s) => s.errorBar)
  const rawData = useChartStore((s) => s.rawData)
  const mapping = useChartStore((s) => s.mapping)
  const styleConfig = useChartStore((s) => s.styleConfig)

  // 衍生資料以 useMemo 快取，避免每次 render 產生新陣列造成無限重繪
  const points = useMemo<CleanPoint[]>(() => {
    if (!mapping.xAxis || !mapping.yAxis) return []
    const result: CleanPoint[] = []
    for (const row of rawData) {
      const x = toNumber(row[mapping.xAxis])
      const y = toNumber(row[mapping.yAxis])
      if (x === null || y === null) continue
      const point: CleanPoint = { x, y }
      const xErr = mapping.xError ? toNumber(row[mapping.xError]) : null
      const yErr = mapping.yError ? toNumber(row[mapping.yError]) : null
      if (mapping.xError && xErr !== null) point.xError = xErr
      if (mapping.yError && yErr !== null) point.yError = yErr
      result.push(point)
    }
    return result
  }, [rawData, mapping])

  const fit = useMemo<RegressionResult | null>(() => {
    if (!regression.enabled || points.length === 0) return null
    return fitRegression(
      points.map((p) => ({ x: p.x, y: p.y })),
      regression.type,
      { forceZeroIntercept: regression.forceZeroIntercept },
    )
  }, [points, regression])

  const traces = useMemo<Plotly.Data[]>(() => {
    if (points.length === 0) return []

    const base: Omit<Plotly.Data, 'type'> = {
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      marker: { ...styleConfig.marker },
      line: { color: styleConfig.axisColor, width: styleConfig.lineWidth },
      name: '實驗數據',
      showlegend: false,
    }

    const errorY = buildErrorObject(
      points.map((p) => p.y),
      points.map((p) => p.yError ?? null),
      errorBar.y,
    )
    const errorX = buildErrorObject(
      points.map((p) => p.x),
      points.map((p) => p.xError ?? null),
      errorBar.x,
    )
    if (errorY) base.error_y = errorY
    if (errorX) base.error_x = errorX

    const series: Plotly.Data[] = []
    if (chartType === 'scatter') {
      series.push({ ...base, type: 'scatter', mode: 'markers' })
    } else if (chartType === 'line') {
      series.push({ ...base, type: 'scatter', mode: 'lines+markers' })
    } else {
      series.push({
        ...base,
        type: 'bar',
        marker: { color: styleConfig.marker.color },
        error_y: base.error_y,
      })
    }

    if (fit) {
      const fitTrace = buildFitTrace(points, fit, regression)
      if (fitTrace) series.push(fitTrace)
    }

    return series
  }, [points, chartType, regression, errorBar, fit, styleConfig])

  const layout = useMemo<Partial<Plotly.Layout>>(() => {
    const { xAxis, yAxis } = config
    const family = resolveFontFamily(styleConfig.font)
    const regressionText =
      fit && !Number.isNaN(fit.r2)
        ? `${fit.formula}  (R² = ${formatR2(fit.r2)})`
        : null

    return {
      title: {
        text: config.title,
        font: { size: styleConfig.fontSize, color: styleConfig.axisColor, family },
        x: 0.5,
        xanchor: 'center',
      },
      paper_bgcolor: '#FFFFFF',
      plot_bgcolor: '#FFFFFF',
      font: { family, color: styleConfig.axisColor, size: styleConfig.tickFontSize },
      autosize: true,
      margin: { l: 70, r: 40, t: 80, b: 60 },
      xaxis: buildAxis(
        xAxis,
        styleConfig,
        styleConfig.showXGrid,
        styleConfig.xMin,
        styleConfig.xMax,
        styleConfig.xStep,
      ),
      yaxis: buildAxis(
        yAxis,
        styleConfig,
        styleConfig.showYGrid,
        styleConfig.yMin,
        styleConfig.yMax,
        styleConfig.yStep,
      ),
      barmode: 'group',
      annotations: regressionText
        ? [
            {
              xref: 'paper',
              yref: 'paper',
              x: 1,
              y: 1.02,
              xanchor: 'right',
              yanchor: 'bottom',
              showarrow: false,
              text: regressionText,
              font: { size: 12, color: '#000000', family },
              align: 'left',
            },
          ]
        : [],
    }
  }, [config, fit, styleConfig])

  // 儲存純數據快照供匯出使用（避免解析 Plotly 內部狀態）
  useEffect(() => {
    setChartSnapshot(traces, layout)
  }, [traces, layout])

  const plotConfig = useMemo(
    () => ({
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'] as const,
      toImageButtonOptions: {
        format: 'svg' as const,
        filename: 'lab-plot',
        scale: 2,
      },
    }),
    [],
  )

  const warnings = useMemo(() => {
    const msgs: string[] = []
    if (mapping.xAxis && mapping.yAxis && points.length === 0) {
      msgs.push('沒有可用的數據點，請確認 X/Y 軸欄位是否正確且包含數值。')
    } else if (points.length === 1) {
      msgs.push('數據點僅有 1 筆，無法進行回歸分析。')
    } else if (points.length < 2 && regression.enabled) {
      msgs.push('數據點少於 2 筆，無法進行線性擬合。')
    }
    if (regression.enabled && points.length >= 2) {
      const allSameX = points.every((p) => p.x === points[0].x)
      const allSameY = points.every((p) => p.y === points[0].y)
      if (allSameX) {
        msgs.push('所有數據點的 X 值均相同，無法計算回歸線斜率。')
      }
      if (allSameY) {
        msgs.push('所有數據點的 Y 值均相同，回歸線斜率為 0。')
      }
    }
    return msgs
  }, [points, mapping, regression])

  return (
    <div className="w-full">
      {warnings.map((msg, i) => (
        <DataWarning key={i} message={msg} />
      ))}
      <Plot
        data={traces}
        layout={layout}
        config={plotConfig}
        useResizeHandler={true}
        divId="labplot-chart"
        style={{ width: '100%', height }}
        className="w-full"
      />
    </div>
  )
}

function buildAxis(
  axis: AxisConfig,
  style: ChartStyleConfig,
  showGrid: boolean,
  rangeMin?: number,
  rangeMax?: number,
  dtick?: number,
): Partial<Plotly.LayoutAxis> {
  return {
    title: { text: axisTitle(axis.label, axis.unit) },
    tickcolor: style.axisColor,
    ticks: style.tickDirection,
    ticklen: 6,
    tickfont: { size: style.tickFontSize, family: resolveFontFamily(style.font) },
    showline: true,
    linecolor: style.axisColor,
    linewidth: style.axisWidth,
    zeroline: false,
    showgrid: showGrid,
    gridcolor: '#E5E7EB',
    gridwidth: 1,
    griddash: style.gridStyle === 'dashed' ? 'dash' : undefined,
    range:
      rangeMin != null && rangeMax != null ? [rangeMin, rangeMax] : undefined,
    dtick,
  }
}
