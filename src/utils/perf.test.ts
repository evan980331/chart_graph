import { describe, it, expect, vi } from 'vitest'
import { bucketWidth, targetForWidth, getDisplayPoints } from '@/utils/downsample'
import * as mathStats from '@/utils/mathStats'
import type { CleanPoint } from '@/stores/useChartStore'

function makePoints(n: number): CleanPoint[] {
  return Array.from({ length: n }, (_, i) => ({ x: i, y: Math.sin(i * 0.01) * 10 }))
}

describe('bucket', () => {
  it('same bucket for 800-999', () => {
    expect(bucketWidth(800)).toBe(800)
    expect(bucketWidth(850)).toBe(800)
    expect(bucketWidth(999)).toBe(800)
    expect(bucketWidth(1000)).toBe(1000)
  })
  it('target bucketed', () => {
    expect(targetForWidth(800)).toBe(targetForWidth(801))
    expect(targetForWidth(800)).not.toBe(targetForWidth(1000))
  })
  it('display stable within bucket', () => {
    const pts = makePoints(8000)
    const a = getDisplayPoints(pts, 'line', 800)
    const b = getDisplayPoints(pts, 'line', 850)
    const c = getDisplayPoints(pts, 'line', 999)
    expect(a.length).toBe(b.length)
    expect(b.length).toBe(c.length)
  })
})

describe('resize does not recompute regression', () => {
  it('fitRegression not called on resize (bucket stable)', () => {
    const spy = vi.spyOn(mathStats, 'fitRegression')
    const raw = makePoints(8000).map((p) => ({ x: p.x, y: p.y }))
    mathStats.fitRegression(raw, 'linear')
    const before = spy.mock.calls.length
    // simulate 20 resizes within same bucket (800-850) — should not trigger new regression if caller correctly memoizes;
    // here we just verify that display decimation does not trigger regression
    for (let w = 800; w < 820; w++) {
      getDisplayPoints(raw as CleanPoint[], 'line', w)
    }
    expect(spy.mock.calls.length).toBe(before) // no extra regression
    spy.mockRestore()
  })
})
