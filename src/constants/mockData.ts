import type { ChartConfig, DataRow } from '@/types/chart'

export const mockData: DataRow[] = [
  { id: 'r1', x: 0.1, y: 0.05, yError: 0.02 },
  { id: 'r2', x: 0.2, y: 0.2, yError: 0.02 },
  { id: 'r3', x: 0.3, y: 0.44, yError: 0.02 },
  { id: 'r4', x: 0.4, y: 0.78, yError: 0.02 },
  { id: 'r5', x: 0.5, y: 1.22, yError: 0.02 },
]

export const mockChartConfig: ChartConfig = {
  title: '自由落體運動：位移與時間關係',
  xAxis: {
    label: '時間',
    unit: 's',
    min: 0,
    max: 0.6,
    step: 0.1,
  },
  yAxis: {
    label: '位移',
    unit: 'm',
    min: 0,
    max: 1.4,
    step: 0.2,
  },
  showGrid: true,
}
