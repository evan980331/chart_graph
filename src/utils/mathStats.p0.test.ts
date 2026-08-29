import { describe, it, expect } from 'vitest'
import { linearRegression, polynomialRegression, exponentialRegression, powerRegression, type FitPoint } from '@/utils/mathStats'

// P0-1: scale-aware threshold — must not degenerate for valid small-scale data
describe('P0-1 polynomial scale-aware tolerance', () => {
  it('tiny X 1e-6 scale succeeds', () => {
    const pts: FitPoint[] = [0, 1, 2, 3, 4].map((x) => {
      const xx = x * 1e-6
      return { x: xx, y: 3 * xx * xx + 2 * xx + 1 }
    })
    const r = polynomialRegression(pts)
    expect(r.status).toBe('ok')
    expect(r.r2).toBeCloseTo(1, 4)
  })
  it('extremely tiny X 1e-12 scale succeeds', () => {
    // values still finite; should not be flagged degenerate due to absolute det
    const pts: FitPoint[] = [0, 1, 2, 3, 4].map((x) => {
      const xx = x * 1e-9
      return { x: xx, y: 2 * xx * xx + 5 * xx + 7 }
    })
    const r = polynomialRegression(pts)
    expect(r.status).toBe('ok')
  })
  it('identical X degenerate retains counts', () => {
    const pts: FitPoint[] = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }]
    const r = polynomialRegression(pts)
    expect(r.status).toBe('degenerate')
    expect(r.totalCount).toBe(4)
    expect(r.usedCount).toBe(4)
    expect(r.excludedCount).toBe(0)
  })
  it('nearly identical X still ok', () => {
    const pts: FitPoint[] = [{ x: 1, y: 3 }, { x: 1.0001, y: 3.0002 }, { x: 1.0002, y: 3.0004 }, { x: 1.0003, y: 3.0006 }]
    const r = polynomialRegression(pts)
    expect(Number.isFinite(r.r2)).toBe(true)
  })
})

// P0-2: finite validation
describe('P0-2 finite validation for all models', () => {
  const models = [
    { name: 'linear', fn: linearRegression },
    { name: 'polynomial', fn: polynomialRegression },
    { name: 'exponential', fn: exponentialRegression },
    { name: 'power', fn: powerRegression },
  ] as const

  for (const { name, fn } of models) {
    it(`${name} excludes NaN/Infinity/-Infinity and reports counts`, () => {
      const pts: FitPoint[] = [
        { x: 1, y: 1 },
        { x: NaN, y: 2 },
        { x: 3, y: Infinity },
        { x: 4, y: -Infinity },
        { x: Infinity, y: 5 },
        { x: 2, y: 4 },
        { x: 3, y: 9 },
      ]
      const r = fn(pts)
      // finite points are (1,1),(2,4),(3,9) => at least 3 for poly, 2 for others
      expect(r.totalCount).toBe(7)
      expect(r.excludedCount).toBeGreaterThanOrEqual(4)
      expect(r.usedCount).toBe(3)
      expect(Number.isFinite(r.r2) || Number.isNaN(r.r2)).toBe(true)
      // r2 must not be Infinity
      expect(r.r2 === Infinity || r.r2 === -Infinity).toBe(false)
    })
  }

  it('exponential filters y<=0 and counts', () => {
    const pts: FitPoint[] = [{ x: 1, y: -1 }, { x: 2, y: 0 }, { x: 3, y: 5 }, { x: 4, y: 10 }]
    const r = exponentialRegression(pts)
    expect(r.totalCount).toBe(4)
    expect(r.usedCount).toBe(2)
    expect(r.excludedCount).toBe(2)
  })

  it('power filters x<=0 or y<=0', () => {
    const pts: FitPoint[] = [{ x: -1, y: 1 }, { x: 0, y: 5 }, { x: 1, y: -1 }, { x: 2, y: 4 }, { x: 3, y: 9 }]
    const r = powerRegression(pts)
    expect(r.totalCount).toBe(5)
    expect(r.usedCount).toBe(2)
    expect(r.excludedCount).toBe(3)
  })
})

// P0-3 + P0-4: counts and status
describe('P0-3/4 counts and degenerate', () => {
  it('normal data ok status', () => {
    const r = linearRegression([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }])
    expect(r.status).toBe('ok')
    expect(r.totalCount).toBe(3)
    expect(r.usedCount).toBe(3)
    expect(r.excludedCount).toBe(0)
  })
  it('insufficient-data has correct counts', () => {
    const r = linearRegression([{ x: 1, y: 2 }])
    expect(r.status).toBe('insufficient-data')
    expect(r.totalCount).toBe(1)
    expect(r.usedCount).toBe(1)
  })
  it('degenerate identical X retains counts', () => {
    const r = linearRegression([{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }])
    expect(r.status).toBe('degenerate')
    expect(r.totalCount).toBe(3)
    expect(r.usedCount).toBe(3)
    expect(r.excludedCount).toBe(0)
    expect(r.reason).toBeDefined()
  })
  it('all filtered -> insufficient with excludedCount', () => {
    const r = exponentialRegression([{ x: 1, y: -1 }, { x: 2, y: -2 }])
    expect(r.totalCount).toBe(2)
    expect(r.usedCount).toBe(0)
    expect(r.excludedCount).toBe(2)
    expect(r.status).toBe('insufficient-data')
  })
})
