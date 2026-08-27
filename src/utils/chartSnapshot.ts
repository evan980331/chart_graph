import type { Data, Layout } from 'plotly.js-dist-min'

let snapshot: { data: Data[]; layout: Partial<Layout> } | null = null

export function setChartSnapshot(data: Data[], layout: Partial<Layout>) {
  snapshot = { data, layout }
}

export function getChartSnapshot(): { data: Data[]; layout: Partial<Layout> } | null {
  return snapshot
}
