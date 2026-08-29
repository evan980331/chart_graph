import { describe, it, expect } from 'vitest'
import { linearRegression, polynomialRegression, exponentialRegression, powerRegression, type FitPoint } from '@/utils/mathStats'

// 1. Exponential must not use rounded coefs — verify high-precision recovery
describe('P1-1 exponential raw precision', () => {
  it('recovers b precisely without rounding drift', () => {
    const pts: FitPoint[] = [0, 0.5, 1, 1.5, 2].map((x) => ({ x, y: 3 * Math.exp(0.7 * x) }))
    const r = exponentialRegression(pts)
    expect(r.status).toBe('ok')
    expect(r.coefs.a).toBeCloseTo(3, 2)
    expect(r.coefs.b).toBeCloseTo(0.7, 4)
  })
})

// 2. Polynomial forceZeroIntercept extreme scales
describe('P1-2 polynomial forceZeroIntercept extremes', () => {
  it('Case A: normal y=2x²+3x', () => {
    const pts: FitPoint[] = [1, 2, 3, 4, 5].map((x) => ({ x, y: 2 * x * x + 3 * x }))
    const r = polynomialRegression(pts, { forceZeroIntercept: true })
    expect(r.status).toBe('ok')
    expect(r.coefs.a).toBeCloseTo(2, 4)
    expect(r.coefs.b).toBeCloseTo(3, 4)
    expect(r.coefs.c).toBe(0)
    expect(r.r2).toBeCloseTo(1, 8)
  })
  it('Case B: tiny x 1e-6 y=2x²+3x not degenerate', () => {
    const pts: FitPoint[] = [1e-6, 2e-6, 3e-6, 4e-6, 5e-6].map((x) => ({ x, y: 2 * x * x + 3 * x }))
    const r = polynomialRegression(pts, { forceZeroIntercept: true })
    expect(r.status).toBe('ok')
    expect(Number.isFinite(r.coefs.a)).toBe(true)
    expect(Number.isFinite(r.coefs.b)).toBe(true)
    expect(Number.isFinite(r.r2)).toBe(true)
  })
  it('Case C: large x ~1e6', () => {
    const base = 1e6
    const pts: FitPoint[] = [0, 1, 2, 3, 4].map((d) => {
      const x = base + d
      return { x, y: 2 * x * x + 3 * x }
    })
    const r = polynomialRegression(pts, { forceZeroIntercept: true })
    expect(r.status).toBe('ok')
    expect(Number.isFinite(r.coefs.a)).toBe(true)
    expect(Number.isFinite(r.coefs.b)).toBe(true)
    expect(Number.isFinite(r.r2)).toBe(true)
    expect(r.r2).not.toBeNaN()
  })
})

// 3. status ok => r2 finite; insufficient/degenerate handling
describe('P1-3 R² finite when ok', () => {
  const models: Array<[string, (pts: FitPoint[]) => ReturnType<typeof linearRegression>]> = [
    ['linear', linearRegression],
    ['polynomial', polynomialRegression],
    ['exponential', exponentialRegression],
    ['power', powerRegression],
  ]
  for (const [name, fn] of models) {
    it(`${name}: NaN/Infinity points excluded, ok => r2 finite`, () => {
      const pts: FitPoint[] = [
        { x: 1, y: 2 },
        { x: NaN, y: 2 },
        { x: 2, y: Infinity },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
        { x: Infinity, y: 3 },
        { x: 4, y: -Infinity },
      ]
      const r = fn(pts)
      if (r.status === 'ok') expect(Number.isFinite(r.r2)).toBe(true)
      expect([NaN, Infinity, -Infinity].includes(r.r2 as number)).toBe(false)
    })
  }
})

// 4. Constant-Y
describe('P1-4 constant-Y', () => {
  it('Y identical linear => status ok r2=1', () => {
    const r = linearRegression([{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }])
    expect(r.status).toBe('ok')
    expect(r.r2).toBe(1)
  })
  it('Y identical r2 never NaN/Infinity', () => {
    const r = linearRegression([{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }])
    expect(Number.isFinite(r.r2)).toBe(true)
  })
})
