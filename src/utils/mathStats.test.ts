import { describe, it, expect } from 'vitest'
import {
  calculateErrorBars,
  exponentialRegression,
  fitRegression,
  linearRegression,
  polynomialRegression,
  powerRegression,
} from '@/utils/mathStats'

const linearData = [
  { x: 1, y: 3 },
  { x: 2, y: 5 },
  { x: 3, y: 7 },
  { x: 4, y: 9 },
  { x: 5, y: 11 },
]

describe('linearRegression', () => {
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
})

describe('polynomialRegression', () => {
  it('recovers exact y = x² - 2x + 1', () => {
    const r = polynomialRegression([0, 1, 2, 3, 4].map((x) => ({ x, y: x * x - 2 * x + 1 })))
    expect(r.coefs.a).toBeCloseTo(1, 6)
    expect(r.coefs.b).toBeCloseTo(-2, 6)
    expect(r.coefs.c).toBeCloseTo(1, 6)
    expect(r.r2).toBeCloseTo(1, 8)
  })
})

describe('exponentialRegression', () => {
  it('recovers y = 2·e^(0.5x)', () => {
    const r = exponentialRegression([0, 1, 2, 3].map((x) => ({ x, y: 2 * Math.exp(0.5 * x) })))
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
})

describe('powerRegression', () => {
  it('recovers y = 3·x²', () => {
    const r = powerRegression([1, 2, 3, 4].map((x) => ({ x, y: 3 * Math.pow(x, 2) })))
    expect(r.coefs.a).toBeCloseTo(3, 2)
    expect(r.coefs.b).toBeCloseTo(2, 3)
    expect(r.r2).toBeCloseTo(1, 8)
  })

  it('rejects x <= 0 in predicting domain', () => {
    const r = powerRegression([1, 2, 3].map((x) => ({ x, y: x * x })))
    expect(r.predict(0)).toBeNull()
    expect(r.predict(-1)).toBeNull()
  })
})

describe('fitRegression', () => {
  it('dispatches to the requested model', () => {
    expect(fitRegression(linearData, 'linear').type).toBe('linear')
    expect(fitRegression(linearData, 'polynomial').type).toBe('polynomial')
    expect(fitRegression(linearData, 'exponential').type).toBe('exponential')
    expect(fitRegression(linearData, 'power').type).toBe('power')
  })
})

describe('calculateErrorBars', () => {
  it('computes percent errors', () => {
    const r = calculateErrorBars([100, 200, null], { source: 'percent', value: 10 }, undefined)
    expect(r.array).toEqual([10, 20, null])
  })

  it('uses fixed error magnitude', () => {
    const r = calculateErrorBars([1, 2, 3], { source: 'fixed', value: 0.5 }, undefined)
    expect(r.array).toEqual([0.5, 0.5, 0.5])
  })

  it('passes through field error array', () => {
    const r = calculateErrorBars([1, 2, 3], { source: 'field', value: 0 }, [0.1, 0.2, 0.3])
    expect(r.array).toEqual([0.1, 0.2, 0.3])
  })

  it('computes SE from repeated measurements', () => {
    const r = calculateErrorBars(
      [0, 0, 0],
      { source: 'se', value: 0, repeated: [[1, 3], [2, 6], [8]] },
      undefined,
    )
    expect(r.array?.[0]).toBeCloseTo(1 / Math.SQRT2, 6)
    expect(r.array?.[2]).toBeNull()
  })
})
