import type { CleanPoint } from '@/stores/useChartStore'

/**
 * Largest Triangle Three Buckets (LTTB) downsampling.
 * Preserves visual shape, peaks and valleys for time-series / line data.
 * Input must be sorted by x (caller sorts if needed).
 */
export function lttbDownsample(points: CleanPoint[], threshold: number): CleanPoint[] {
  if (threshold >= points.length || threshold <= 2) return points
  if (points.length <= 2) return points

  const sampled: CleanPoint[] = []
  const bucketSize = (points.length - 2) / (threshold - 2)

  let a = 0
  sampled.push(points[a])

  for (let i = 0; i < threshold - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1
    const rangeEnd = Math.floor((i + 2) * bucketSize) + 1
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1
    // avg of next bucket
    let avgX = 0
    let avgY = 0
    let avgLen = Math.max(1, avgRangeEnd - avgRangeStart)
    // clamp
    const avgEnd = Math.min(avgRangeEnd, points.length)
    const avgStart = Math.min(avgRangeStart, points.length - 1)
    avgLen = Math.max(1, avgEnd - avgStart)
    for (let j = avgStart; j < avgEnd; j++) {
      avgX += points[j].x
      avgY += points[j].y
    }
    avgX /= avgLen
    avgY /= avgLen

    const rangeS = Math.min(rangeStart, points.length - 1)
    const rangeE = Math.min(rangeEnd, points.length)
    let maxArea = -1
    let maxIdx = rangeS
    for (let j = rangeS; j < rangeE; j++) {
      const area = Math.abs(
        (points[a].x - avgX) * (points[j].y - points[a].y) -
          (points[a].x - points[j].x) * (avgY - points[a].y),
      )
      if (area > maxArea) {
        maxArea = area
        maxIdx = j
      }
    }
    sampled.push(points[maxIdx])
    a = maxIdx
  }
  sampled.push(points[points.length - 1])
  return sampled
}

/** Buckets: 200px per step to avoid per-pixel recompute. e.g. 800-999 → 800 */
export function bucketWidth(width: number | undefined): number {
  const w = width && Number.isFinite(width) && width > 0 ? width : 800
  return Math.floor(w / 200) * 200
}

export function targetForWidth(width: number | undefined): number {
  const bw = bucketWidth(width)
  return Math.round(Math.min(4000, Math.max(2000, bw * 2.5)))
}

/**
 * Build display data from raw analysis points.
 * - rawData never mutated
 * - Bar: no downsampling (preserve categories), caller may warn if huge
 * - Line/Scatter: LTTB if exceeds threshold, target ≈ bucketed width * 2.5
 * Bucket ensures width 800-999 all map to same target, avoiding per-pixel LTTB.
 */
export function getDisplayPoints(
  points: CleanPoint[],
  chartType: string,
  chartWidth: number | undefined,
): CleanPoint[] {
  if (points.length === 0) return points
  if (chartType === 'bar') return points // bar not downsampled

  const DISPLAY_THRESHOLD = 2000
  if (points.length <= DISPLAY_THRESHOLD) return points

  const target = targetForWidth(chartWidth)
  if (points.length <= target) return points

  // LTTB expects x-sorted; sort copy for display only
  const sorted = [...points].sort((a, b) => a.x - b.x)
  return lttbDownsample(sorted, target)
}
