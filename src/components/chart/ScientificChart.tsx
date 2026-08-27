import { useMemo } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import {
  selectCleanData,
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

const Plot = createPlotlyComponent(Plotly)

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
  const points = useChartStore(selectCleanData)

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
      marker: { size: 6, color: '#000000' },
      line: { color: '#000000', width: 1.5 },
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
        marker: { color: '#000000' },
        error_y: base.error_y,
      })
    }

    if (fit) {
      const fitTrace = buildFitTrace(points, fit, regression)
      if (fitTrace) series.push(fitTrace)
    }

    return series
  }, [points, chartType, regression, errorBar, fit])

  const layout = useMemo<Partial<Plotly.Layout>>(() => {
    const { xAxis, yAxis } = config
    const regressionText =
      fit && !Number.isNaN(fit.r2)
        ? `${fit.formula}  (R² = ${formatR2(fit.r2)})`
        : null

    return {
      title: {
        text: config.title,
        font: { size: 16, color: '#000000' },
        x: 0.5,
        xanchor: 'center',
      },
      paper_bgcolor: '#FFFFFF',
      plot_bgcolor: '#FFFFFF',
      font: { family: 'Arial, sans-serif', color: '#000000', size: 13 },
      autosize: true,
      margin: { l: 70, r: 40, t: 60, b: 60 },
      xaxis: buildAxis(xAxis, config.showGrid),
      yaxis: buildAxis(yAxis, config.showGrid),
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
              font: { size: 12, color: '#000000' },
              align: 'left',
            },
          ]
        : [],
    }
  }, [config, fit])

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

  return (
    <Plot
      data={traces}
      layout={layout}
      config={plotConfig}
      useResizeHandler={true}
      style={{ width: '100%', height }}
      className="w-full"
    />
  )
}

function buildAxis(axis: AxisConfig, showGrid: boolean): Partial<Plotly.LayoutAxis> {
  return {
    title: { text: axisTitle(axis.label, axis.unit) },
    tickcolor: '#000000',
    ticks: 'outside',
    ticklen: 6,
    showline: true,
    linecolor: '#000000',
    linewidth: 1,
    zeroline: false,
    showgrid: showGrid,
    gridcolor: '#E5E7EB',
    gridwidth: 1,
    range:
      axis.min != null && axis.max != null ? [axis.min, axis.max] : undefined,
    dtick: axis.step,
  }
}
