import { describe, it, expect } from 'vitest'
import { lttbDownsample, getDisplayPoints } from '@/utils/downsample'
import { fitRegression, type FitPoint } from '@/utils/mathStats'
import type { CleanPoint } from '@/stores/useChartStore'

function makePoints(n: number): CleanPoint[] {
  return Array.from({ length: n }, (_, i) => ({ x: i, y: Math.sin(i * 0.01) * 100 + i * 0.1 }))
}

describe('lttbDownsample', () => {
  it('preserves endpoints', () => {
    const pts = makePoints(100)
    const down = lttbDownsample(pts, 20)
    expect(down[0]).toEqual(pts[0])
    expect(down[down.length - 1]).toEqual(pts[pts.length - 1])
  })
  it('returns original if threshold >= length', () => {
    const pts = makePoints(10)
    expect(lttbDownsample(pts, 20)).toBe(pts)
  })
  it('retains peaks', () => {
    const pts: CleanPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 10 }, // peak
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ]
    const down = lttbDownsample(pts, 4)
    expect(down.some((p) => p.y === 10)).toBe(true)
  })
  it('does not mutate raw', () => {
    const pts = makePoints(5000)
    const copy = pts.map((p) => ({ ...p }))
    lttbDownsample(pts, 1000)
    expect(pts).toEqual(copy)
  })
})

describe('getDisplayPoints', () => {
  it('no downsample under threshold', () => {
    const pts = makePoints(100)
    expect(getDisplayPoints(pts, 'line', 800)).toBe(pts)
  })
  it('downsamples large line/scatter', () => {
    const pts = makePoints(8000)
    const down = getDisplayPoints(pts, 'line', 800)
    expect(down.length).toBeLessThan(pts.length)
    expect(down.length).toBeGreaterThanOrEqual(1500)
    expect(down.length).toBeLessThanOrEqual(4000)
  })
  it('bar never downsampled', () => {
    const pts = makePoints(8000)
    expect(getDisplayPoints(pts, 'bar', 800).length).toBe(8000)
  })
  it('scatter large also downsampled', () => {
    const pts = makePoints(5000)
    expect(getDisplayPoints(pts, 'scatter', 800).length).toBeLessThan(5000)
  })
})

describe('raw vs display separation', () => {
  it('regression uses raw not display', () => {
    const raw: FitPoint[] = Array.from({ length: 8000 }, (_, i) => ({ x: i * 0.01, y: 2 * (i * 0.01) + 1 }))
    const clean: CleanPoint[] = raw.map((p) => ({ x: p.x, y: p.y }))
    const display = getDisplayPoints(clean, 'line', 800)
    const rRaw = fitRegression(raw, 'linear')
    void fitRegression(display.map((p) => ({ x: p.x, y: p.y })), 'linear')
    // raw regression should be perfect; display may slightly differ but both finite
    expect(rRaw.status).toBe('ok')
    expect(rRaw.r2).toBeCloseTo(1, 6)
    // ensure display downsampling didn't affect raw (still 8000)
    expect(clean.length).toBe(8000)
    expect(display.length).toBeLessThan(8000)
    // slope close
    expect(rRaw.coefs.a).toBeCloseTo(2, 4)
  })
  it('export raw complete', () => {
    const pts = makePoints(8000)
    const display = getDisplayPoints(pts, 'line', 800)
    expect(pts.length).toBe(8000)
    expect(display.length).toBeLessThan(8000)
  })
})

describe('performance benchmark', () => {
  const sizes = [100, 1000, 5000, 8000, 10000, 20000]
  for (const n of sizes) {
    it(`handles ${n} points without hang`, () => {
      const pts = makePoints(n)
      const t0 = performance.now()
      const down = getDisplayPoints(pts, 'line', 800)
      const t1 = performance.now()
      expect(t1 - t0).toBeLessThan(200) // 200ms budget
      if (n > 2000) expect(down.length).toBeLessThan(n)
    })
  }
})
