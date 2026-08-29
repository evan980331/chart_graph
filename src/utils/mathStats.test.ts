import { describe, it, expect } from 'vitest'
import {
  calculateErrorBars,
  exponentialRegression,
  fitRegression,
  linearRegression,
  polynomialRegression,
  powerRegression,
  type FitPoint,
} from '@/utils/mathStats'

// ===== LINEAR REGRESSION =====

describe('linearRegression', () => {
  const linearData: FitPoint[] = [
    { x: 1, y: 3 },
    { x: 2, y: 5 },
    { x: 3, y: 7 },
    { x: 4, y: 9 },
    { x: 5, y: 11 },
  ]

  it('recovers exact y = 2x + 1', () => {
    const r = linearRegression(linearData)
    expect(r.coefs.a).toBeCloseTo(2, 9)
    expect(r.coefs.b).toBeCloseTo(1, 9)
    expect(r.r2).toBeCloseTo(1, 8)
    expect(r.formula).toBe('y = 2x + 1')
    expect(r.predict(10)).toBe(21)
  })

  it('forces a zero intercept when requested', () => {
    const r = linearRegression(
      [
        { x: 1, y: 2.9 },
        { x: 2, y: 6.1 },
        { x: 3, y: 9.0 },
        { x: 4, y: 12.2 },
      ],
      { forceZeroIntercept: true },
    )
    expect(r.coefs.b).toBe(0)
    expect(r.coefs.a).toBeCloseTo(3, 1)
  })

  it('degrades gracefully on x variance of zero', () => {
    const r = linearRegression([
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('degenerates with fewer than 2 points', () => {
    const r = linearRegression([{ x: 1, y: 2 }])
    expect(Number.isNaN(r.r2)).toBe(true)
    expect(r.predict(1)).toBeNull()
  })

  it('degenerates with empty data', () => {
    const r = linearRegression([])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('handles identical y values (horizontal line)', () => {
    const r = linearRegression([
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
    ])
    expect(r.coefs.a).toBeCloseTo(0, 9)
    expect(r.coefs.b).toBeCloseTo(5, 9)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('handles large x values', () => {
    const r = linearRegression([
      { x: 1000000, y: 2000001 },
      { x: 1000001, y: 2000003 },
      { x: 1000002, y: 2000005 },
    ])
    expect(r.coefs.a).toBeCloseTo(2, 6)
    expect(r.coefs.b).toBeCloseTo(1, 0)
    expect(r.r2).toBeCloseTo(1, 6)
  })

  it('handles small x values', () => {
    const r = linearRegression([
      { x: 0.001, y: 0.003 },
      { x: 0.002, y: 0.005 },
      { x: 0.003, y: 0.007 },
    ])
    expect(r.coefs.a).toBeCloseTo(2, 6)
    expect(r.coefs.b).toBeCloseTo(0.001, 6)
  })

  it('handles negative x values', () => {
    const r = linearRegression([
      { x: -2, y: -3 },
      { x: -1, y: -1 },
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ])
    expect(r.coefs.a).toBeCloseTo(2, 6)
    expect(r.coefs.b).toBeCloseTo(1, 6)
  })
})

// ===== POLYNOMIAL REGRESSION =====

describe('polynomialRegression', () => {
  it('recovers exact y = 3x² + 2x + 1', () => {
    const points: FitPoint[] = [0, 1, 2, 3, 4, 5].map((x) => ({
      x,
      y: 3 * x * x + 2 * x + 1,
    }))
    const r = polynomialRegression(points)
    expect(r.coefs.a).toBeCloseTo(3, 4)
    expect(r.coefs.b).toBeCloseTo(2, 4)
    expect(r.coefs.c).toBeCloseTo(1, 4)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('recovers exact y = x² - 2x + 1', () => {
    const points: FitPoint[] = [0, 1, 2, 3, 4].map((x) => ({
      x,
      y: x * x - 2 * x + 1,
    }))
    const r = polynomialRegression(points)
    expect(r.coefs.a).toBeCloseTo(1, 6)
    expect(r.coefs.b).toBeCloseTo(-2, 6)
    expect(r.coefs.c).toBeCloseTo(1, 6)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('handles large x values (numerical stability)', () => {
    const points: FitPoint[] = [0, 1, 2, 3, 4].map((x) => ({
      x: x + 1000000,
      y: 3 * (x + 1000000) ** 2 + 2 * (x + 1000000) + 1,
    }))
    const r = polynomialRegression(points)
    expect(r.r2).toBeCloseTo(1, 4)
    expect(r.predict(1000002)).toBeCloseTo(points[2].y, -2)
  })

  it('handles very small x values', () => {
    const points: FitPoint[] = [0, 1, 2, 3, 4].map((x) => ({
      x: x * 0.000001,
      y: 3 * (x * 0.000001) ** 2 + 2 * (x * 0.000001) + 1,
    }))
    const r = polynomialRegression(points)
    expect(r.r2).toBeCloseTo(1, 6)
  })

  it('handles nearly identical x values', () => {
    const points: FitPoint[] = [
      { x: 1, y: 3 },
      { x: 1.0001, y: 3.0002 },
      { x: 1.0002, y: 3.0004 },
      { x: 1.0003, y: 3.0006 },
      { x: 1.0004, y: 3.0008 },
    ]
    const r = polynomialRegression(points)
    expect(Number.isFinite(r.r2)).toBe(true)
  })

  it('handles duplicate x values', () => {
    const points: FitPoint[] = [
      { x: 1, y: 6 },
      { x: 2, y: 15 },
      { x: 2, y: 15 },
      { x: 3, y: 28 },
      { x: 4, y: 45 },
    ]
    const r = polynomialRegression(points)
    expect(Number.isFinite(r.r2)).toBe(true)
  })

  it('degenerates with fewer than 3 points', () => {
    const r = polynomialRegression([
      { x: 1, y: 1 },
      { x: 2, y: 4 },
    ])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('degenerates with empty data', () => {
    const r = polynomialRegression([])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('forceZeroIntercept forces constant term to 0', () => {
    const points: FitPoint[] = [1, 2, 3, 4, 5].map((x) => ({
      x,
      y: 3 * x * x + 2 * x,
    }))
    const r = polynomialRegression(points, { forceZeroIntercept: true })
    expect(r.coefs.a).toBeCloseTo(3, 4)
    expect(r.coefs.b).toBeCloseTo(2, 4)
  })
})

// ===== EXPONENTIAL REGRESSION =====

describe('exponentialRegression', () => {
  it('recovers y = 2·e^(0.5x)', () => {
    const points: FitPoint[] = [0, 1, 2, 3, 4].map((x) => ({
      x,
      y: 2 * Math.exp(0.5 * x),
    }))
    const r = exponentialRegression(points)
    expect(r.coefs.a).toBeCloseTo(2, 2)
    expect(r.coefs.b).toBeCloseTo(0.5, 3)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('ignores y <= 0 points and stays valid with enough data', () => {
    const r = exponentialRegression([
      { x: 1, y: -1 },
      { x: 2, y: 3.6 },
      { x: 3, y: 5.4 },
    ])
    expect(Number.isNaN(r.r2)).toBe(false)
  })

  it('is degenerate with fewer than 2 valid points', () => {
    const r = exponentialRegression([
      { x: 1, y: -1 },
      { x: 2, y: -2 },
      { x: 3, y: -3 },
    ])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('degenerates with empty data', () => {
    const r = exponentialRegression([])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('handles large x values', () => {
    const points: FitPoint[] = [0, 1, 2].map((x) => ({
      x: x + 1000000,
      y: 2 * Math.exp(0.5 * x),
    }))
    const r = exponentialRegression(points)
    expect(r.coefs.b).toBeCloseTo(0.5, 2)
  })

  it('handles small x values', () => {
    const points: FitPoint[] = [0, 0.001, 0.002, 0.003].map((x) => ({
      x,
      y: 2 * Math.exp(0.5 * x),
    }))
    const r = exponentialRegression(points)
    expect(r.coefs.a).toBeCloseTo(2, 2)
    expect(r.coefs.b).toBeCloseTo(0.5, 3)
  })

  it('R² is computed on original y scale, not ln(y) scale', () => {
    const points: FitPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 2.718 },
      { x: 2, y: 7.389 },
      { x: 3, y: 20.086 },
    ]
    const r = exponentialRegression(points)
    expect(r.r2).toBeGreaterThan(0.9)
    expect(r.r2).toBeLessThanOrEqual(1)
  })

  it('does not accept forceZeroIntercept', () => {
    const points: FitPoint[] = [0, 1, 2, 3].map((x) => ({
      x,
      y: 2 * Math.exp(0.5 * x),
    }))
    const r1 = exponentialRegression(points)
    const r2 = exponentialRegression(points, { forceZeroIntercept: true })
    expect(r1.coefs.a).toBeCloseTo(r2.coefs.a, 6)
  })
})

// ===== POWER REGRESSION =====

describe('powerRegression', () => {
  it('recovers y = 4·x^1.5', () => {
    const points: FitPoint[] = [1, 2, 3, 4, 5].map((x) => ({
      x,
      y: 4 * Math.pow(x, 1.5),
    }))
    const r = powerRegression(points)
    expect(r.coefs.a).toBeCloseTo(4, 2)
    expect(r.coefs.b).toBeCloseTo(1.5, 3)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('recovers y = 3·x²', () => {
    const points: FitPoint[] = [1, 2, 3, 4].map((x) => ({
      x,
      y: 3 * Math.pow(x, 2),
    }))
    const r = powerRegression(points)
    expect(r.coefs.a).toBeCloseTo(3, 2)
    expect(r.coefs.b).toBeCloseTo(2, 3)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('rejects x <= 0 in predicting domain', () => {
    const r = powerRegression([1, 2, 3].map((x) => ({ x, y: x * x })))
    expect(r.predict(0)).toBeNull()
    expect(r.predict(-1)).toBeNull()
  })

  it('degenerates with fewer than 2 valid points (x>0, y>0)', () => {
    const r = powerRegression([
      { x: -1, y: 1 },
      { x: 0, y: 0 },
    ])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('degenerates with empty data', () => {
    const r = powerRegression([])
    expect(Number.isNaN(r.r2)).toBe(true)
  })

  it('handles large x values', () => {
    const points: FitPoint[] = [1, 2, 3].map((x) => ({
      x: x * 1000000,
      y: 4 * Math.pow(x * 1000000, 1.5),
    }))
    const r = powerRegression(points)
    expect(r.r2).toBeCloseTo(1, 4)
  })

  it('handles small x values', () => {
    const points: FitPoint[] = [0.001, 0.002, 0.003].map((x) => ({
      x,
      y: 4 * Math.pow(x, 1.5),
    }))
    const r = powerRegression(points)
    expect(r.coefs.a).toBeCloseTo(4, 1)
    expect(r.coefs.b).toBeCloseTo(1.5, 3)
  })

  it('does not accept forceZeroIntercept', () => {
    const points: FitPoint[] = [1, 2, 3, 4].map((x) => ({
      x,
      y: 4 * Math.pow(x, 1.5),
    }))
    const r1 = powerRegression(points)
    const r2 = powerRegression(points, { forceZeroIntercept: true })
    expect(r1.coefs.a).toBeCloseTo(r2.coefs.a, 6)
  })
})

// ===== FIT REGRESSION DISPATCHER =====

describe('fitRegression', () => {
  const linearData: FitPoint[] = [
    { x: 1, y: 3 },
    { x: 2, y: 5 },
    { x: 3, y: 7 },
    { x: 4, y: 9 },
    { x: 5, y: 11 },
  ]

  it('dispatches to the requested model', () => {
    expect(fitRegression(linearData, 'linear').type).toBe('linear')
    expect(fitRegression(linearData, 'polynomial').type).toBe('polynomial')
    expect(fitRegression(linearData, 'exponential').type).toBe('exponential')
    expect(fitRegression(linearData, 'power').type).toBe('power')
  })
})

// ===== ERROR BARS =====

describe('calculateErrorBars', () => {
  it('computes percent errors', () => {
    const r = calculateErrorBars(
      [100, 200, null],
      { source: 'percent', value: 10 },
      undefined,
    )
    expect(r.array).toEqual([10, 20, null])
  })

  it('uses fixed error magnitude', () => {
    const r = calculateErrorBars(
      [1, 2, 3],
      { source: 'fixed', value: 0.5 },
      undefined,
    )
    expect(r.array).toEqual([0.5, 0.5, 0.5])
  })

  it('passes through field error array', () => {
    const r = calculateErrorBars(
      [1, 2, 3],
      { source: 'field', value: 0 },
      [0.1, 0.2, 0.3],
    )
    expect(r.array).toEqual([0.1, 0.2, 0.3])
  })

  it('returns null for field source without fieldArray', () => {
    const r = calculateErrorBars(
      [1, 2, 3],
      { source: 'field', value: 0 },
      undefined,
    )
    expect(r.array).toBeNull()
  })

  it('computes SE from repeated measurements', () => {
    const r = calculateErrorBars(
      [0, 0, 0],
      { source: 'se', value: 0, repeated: [[1, 3], [2, 6], [8]] },
      undefined,
    )
    // sample SD of [1,3] = sqrt(2), SE = sqrt(2)/sqrt(2) = 1
    expect(r.array?.[0]).toBeCloseTo(1, 6)
    expect(r.array?.[2]).toBeNull()
  })

  it('computes SE with sample SD (n-1)', () => {
    const r = calculateErrorBars(
      [0, 0, 0],
      { source: 'se', value: 0, repeated: [[1, 2, 3]] },
      undefined,
    )
    const sd = Math.sqrt(((1 - 2) ** 2 + (2 - 2) ** 2 + (3 - 2) ** 2) / 2)
    expect(r.array?.[0]).toBeCloseTo(sd / Math.sqrt(3), 6)
  })

  it('returns null for SE source without repeated data', () => {
    const r = calculateErrorBars(
      [1, 2, 3],
      { source: 'se', value: 0 },
      undefined,
    )
    expect(r.array).toBeNull()
  })
})

// ===== SCIENTIFIC CASES =====

describe('scientific cases', () => {
  it('single pendulum: T² vs L → linear with g = 4π²/slope', () => {
    const g = 9.81
    const points: FitPoint[] = [0.1, 0.2, 0.3, 0.4, 0.5].map((L) => ({
      x: L,
      y: (4 * Math.PI * Math.PI * L) / g,
    }))
    const r = linearRegression(points)
    expect(r.coefs.a).toBeCloseTo((4 * Math.PI * Math.PI) / g, 2)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('spring: F vs x → linear with k = slope', () => {
    const k = 15.3
    const points: FitPoint[] = [0.01, 0.02, 0.03, 0.04, 0.05].map((x) => ({
      x,
      y: k * x,
    }))
    const r = linearRegression(points, { forceZeroIntercept: true })
    expect(r.coefs.a).toBeCloseTo(k, 6)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('damped oscillation: exponential decay in amplitude', () => {
    const gamma = 0.5
    const points: FitPoint[] = [0, 0.5, 1, 1.5, 2].map((t) => ({
      x: t,
      y: 10 * Math.exp(-gamma * t),
    }))
    const r = exponentialRegression(points)
    expect(r.coefs.a).toBeCloseTo(10, 2)
    expect(r.coefs.b).toBeCloseTo(-gamma, 3)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('magnetic force: F vs 1/r² → power law with exponent ≈ -2', () => {
    const points: FitPoint[] = [0.05, 0.1, 0.15, 0.2, 0.25].map((r) => ({
      x: r,
      y: 1 / (r * r),
    }))
    const r = powerRegression(points)
    expect(r.coefs.b).toBeCloseTo(-2, 4)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('RC circuit: V(t) → exponential decay with time constant τ', () => {
    const tau = 0.01
    const V0 = 5
    const points: FitPoint[] = [0, 0.005, 0.01, 0.015, 0.02].map((t) => ({
      x: t,
      y: V0 * Math.exp(-t / tau),
    }))
    const r = exponentialRegression(points)
    expect(r.coefs.a).toBeCloseTo(V0, 1)
    expect(r.coefs.b).toBeCloseTo(-1 / tau, 0)
    expect(r.r2).toBeCloseTo(1, 6)
  })
})
