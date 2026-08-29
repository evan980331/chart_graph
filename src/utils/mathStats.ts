export type RegressionType = 'linear' | 'polynomial' | 'exponential' | 'power'

export interface FitPoint {
  x: number
  y: number
}

export interface FitOptions {
  forceZeroIntercept?: boolean
}

export type RegressionStatus = 'ok' | 'insufficient-data' | 'degenerate'

export interface RegressionResult {
  type: RegressionType
  /** Human readable equation, e.g. "y = 9.81x + 0.02" */
  formula: string
  /** Coefficient of determination R² (on the original y scale, not clamped) */
  r2: number
  /** Named coefficients (may vary per model) */
  coefs: Record<string, number>
  /** @returns fitted y for a given x, or null when x is outside the model domain */
  predict: (x: number) => number | null
  /** Total number of points passed to the regression before any filtering */
  totalCount: number
  /** Number of points actually used for fitting after finite + model filtering */
  usedCount: number
  /** totalCount - usedCount */
  excludedCount: number
  /** Result status */
  status: RegressionStatus
  /** Human readable reason when status !== 'ok' */
  reason?: string
}

export const REGRESSION_TYPE_LABELS: Record<RegressionType, string> = {
  linear: '線性 Linear',
  polynomial: '二次多項式 Polynomial',
  exponential: '指數 Exponential',
  power: '冪函數 Power Law',
}

// ---------- low level helpers ----------

function mean(values: number[]): number {
  if (values.length === 0) return NaN
  return values.reduce((a, b) => a + b, 0) / values.length
}

function isFinitePoint(p: FitPoint): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y)
}

function coefficientOfDetermination(
  ys: number[],
  predicted: (i: number) => number,
): number {
  const yMean = mean(ys)
  let ssRes = 0
  let ssTot = 0
  for (let i = 0; i < ys.length; i++) {
    const pred = predicted(i)
    // predicted should be finite since inputs are finite; guard anyway
    if (!Number.isFinite(pred) || !Number.isFinite(ys[i])) return NaN
    const resid = ys[i] - pred
    ssRes += resid * resid
    ssTot += (ys[i] - yMean) * (ys[i] - yMean)
  }
  if (ssTot === 0) return Number.isFinite(ssRes) && Math.abs(ssRes) < 1e-12 ? 1 : 0
  return 1 - ssRes / ssTot
}

function formatNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs !== 0 && (abs >= 1e4 || abs < 1e-4)) {
    return value.toExponential(3).replace('.', '.').replace('e+', '×10^').replace('e-', '×10^-')
  }
  return String(parseFloat(value.toFixed(4)))
}

function toPrecision(value: number): number {
  return parseFloat(value.toFixed(10))
}

/** Solve a symmetric 3x3 linear system A x = b for the quadratic case. Scale-aware. */
function solveQuadraticSystem(rows: number[][]): number[] | null {
  const n = 3
  const a = rows.map((r) => [...r])
  // global scale for relative tolerance — only coefficient matrix, not RHS
  let maxAbs = 0
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) maxAbs = Math.max(maxAbs, Math.abs(a[r][c]))
  if (maxAbs === 0) return null
  const eps = 1e-12 * maxAbs
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    }
    if (Math.abs(a[pivot][col]) < eps) return null
    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    for (let r = col + 1; r < n; r++) {
      const factor = a[r][col] / a[col][col]
      for (let c = col; c <= n; c++) a[r][c] -= factor * a[col][c]
    }
  }
  const x: number[] = [0, 0, 0]
  for (let r = n - 1; r >= 0; r--) {
    let sum = a[r][n]
    for (let c = r + 1; c < n; c++) sum -= a[r][c] * x[c]
    if (a[r][r] === 0) return null
    x[r] = sum / a[r][r]
  }
  return x
}

// ---------- regression models ----------

export function linearRegression(
  points: FitPoint[],
  options: FitOptions = {},
): RegressionResult {
  const totalCount = points.length
  const finite = points.filter(isFinitePoint)
  const usedCount = finite.length
  const excludedCount = totalCount - usedCount
  if (usedCount < 2) {
    return createDegenerate('linear', totalCount, usedCount, 'insufficient-data', '資料不足：線性擬合至少需要 2 筆有效資料')
  }

  const sx = mean(finite.map((p) => p.x))
  const sy = mean(finite.map((p) => p.y))

  let slope: number
  let intercept: number

  if (options.forceZeroIntercept) {
    let sumXY = 0
    let sumX2 = 0
    for (const p of finite) {
      sumXY += p.x * p.y
      sumX2 += p.x * p.x
    }
    if (sumX2 === 0) {
      return createDegenerate('linear', totalCount, usedCount, 'degenerate', 'X values are identical or all zero, cannot fit with zero intercept')
    }
    slope = sumXY / sumX2
    intercept = 0
  } else {
    let num = 0
    let den = 0
    for (const p of finite) {
      num += (p.x - sx) * (p.y - sy)
      den += (p.x - sx) * (p.x - sx)
    }
    if (den === 0) {
      return createDegenerate('linear', totalCount, usedCount, 'degenerate', 'X values are identical')
    }
    slope = num / den
    intercept = sy - slope * sx
  }

  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) {
    return createDegenerate('linear', totalCount, usedCount, 'degenerate', '計算結果非有限值')
  }

  const coefs = { a: toPrecision(slope), b: toPrecision(intercept) }
  const predict = (x: number) => {
    if (!Number.isFinite(x)) return null
    const y = slope * x + intercept
    return Number.isFinite(y) ? y : null
  }

  return {
    type: 'linear',
    coefs,
    r2: coefficientOfDetermination(finite.map((p) => p.y), (i) => predict(finite[i].x) as number),
    formula: buildLinearFormula(coefs),
    predict,
    totalCount,
    usedCount,
    excludedCount,
    status: 'ok',
  }
}

export function polynomialRegression(
  points: FitPoint[],
  options: FitOptions = {},
): RegressionResult {
  const totalCount = points.length
  const finite = points.filter(isFinitePoint)
  const usedCount = finite.length
  const excludedCount = totalCount - usedCount
  if (usedCount < 3) {
    return createDegenerate('polynomial', totalCount, usedCount, 'insufficient-data', '資料不足：二次擬合至少需要 3 筆有效資料')
  }
  const xs = finite.map((p) => p.x)

  let a: number
  let b: number
  let c: number

  if (options.forceZeroIntercept) {
    // y = a*x² + b*x (c = 0) — solve 2×2 system in original space, scale-aware
    let s2 = 0
    let s3 = 0
    let s4 = 0
    let s1y = 0
    let s2y = 0
    for (const p of finite) {
      const x2 = p.x * p.x
      const x3 = x2 * p.x
      const x4 = x3 * p.x
      s2 += x2
      s3 += x3
      s4 += x4
      s1y += p.x * p.y
      s2y += x2 * p.y
    }
    const det = s4 * s2 - s3 * s3
    // scale-aware check: relative to magnitude of s4*s2 and s3^2
    const scale = Math.max(Math.abs(s4 * s2), Math.abs(s3 * s3))
    if (scale === 0 || Math.abs(det) <= 1e-12 * scale) {
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', 'X values are degenerate, cannot solve quadratic system')
    }
    a = (s2 * s2y - s3 * s1y) / det
    b = (s4 * s1y - s3 * s2y) / det
    c = 0
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', '計算結果非有限值')
    }
  } else {
    // Center and scale x values for numerical stability (scale-aware)
    const mu = mean(xs)
    const ts = xs.map((x) => x - mu)
    // scale by standard deviation to keep matrix well-conditioned for tiny/large ranges
    const s2raw = ts.reduce((s, t) => s + t * t, 0)
    const sigma = s2raw === 0 ? 1 : Math.sqrt(s2raw / usedCount)
    const us = ts.map((t) => t / sigma)

    const s0 = usedCount
    const s1 = us.reduce((s, u) => s + u, 0)
    const s2 = us.reduce((s, u) => s + u * u, 0)
    const s3 = us.reduce((s, u) => s + u * u * u, 0)
    const s4 = us.reduce((s, u) => s + u * u * u * u, 0)
    const s1y = us.reduce((s, u, i) => s + u * finite[i].y, 0)
    const s2y = us.reduce((s, u, i) => s + u * u * finite[i].y, 0)
    const sy = finite.reduce((s, p) => s + p.y, 0)

    const solved = solveQuadraticSystem([
      [s4, s3, s2, s2y],
      [s3, s2, s1, s1y],
      [s2, s1, s0, sy],
    ])
    if (!solved) {
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', 'X values are degenerate, cannot solve quadratic system')
    }

    // Transform back: y = A*u² + B*u + C where u=(x-μ)/σ
    // y = (A/σ²)(x-μ)² + (B/σ)(x-μ) + C
    const A = solved[0]
    const B = solved[1]
    const C = solved[2]
    const A2 = A / (sigma * sigma)
    const B2 = B / sigma
    a = A2
    b = B2 - 2 * A2 * mu
    c = A2 * mu * mu - B2 * mu + C
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', '計算結果非有限值')
    }
  }

  const coefs = {
    a: toPrecision(a),
    b: toPrecision(b),
    c: toPrecision(c),
  }
  const predict = (x: number) => {
    if (!Number.isFinite(x)) return null
    const y = a * x * x + b * x + c
    return Number.isFinite(y) ? y : null
  }

  return {
    type: 'polynomial',
    coefs,
    r2: coefficientOfDetermination(finite.map((p) => p.y), (i) => predict(xs[i]) as number),
    formula: buildPolynomialFormula(coefs),
    predict,
    totalCount,
    usedCount,
    excludedCount,
    status: 'ok',
  }
}

export function exponentialRegression(
  points: FitPoint[],
  _options: FitOptions = {},
): RegressionResult {
  const totalCount = points.length
  const finite = points.filter(isFinitePoint)
  const nonFiniteExcluded = totalCount - finite.length
  // model-specific: y > 0
  const valid = finite.filter((p) => p.y > 0)
  const domainExcluded = finite.length - valid.length
  const usedCount = valid.length
  const excludedCount = totalCount - usedCount
  if (usedCount < 2) {
    const reason = nonFiniteExcluded > 0 || domainExcluded > 0
      ? `資料不足：指數擬合至少需要 2 筆 y>0 的有效資料（已排除 ${excludedCount} 筆）`
      : '資料不足：指數擬合至少需要 2 筆 y>0 的有效資料'
    return createDegenerate('exponential', totalCount, usedCount, usedCount === 0 && finite.length === 0 && totalCount > 0 ? 'insufficient-data' : finite.length < 2 ? 'insufficient-data' : 'insufficient-data', reason)
  }

  // Center x values for numerical stability
  const mu = mean(valid.map((p) => p.x))
  const lnPoints = valid.map((p) => ({ x: p.x - mu, y: Math.log(p.y) }))
  // lnPoints are finite because valid y>0 and x finite
  const base = linearRegression(lnPoints)
  if (base.status !== 'ok' || !Number.isFinite(base.coefs.a) || !Number.isFinite(base.coefs.b)) {
    return createDegenerate('exponential', totalCount, usedCount, 'degenerate', base.reason ?? '無法建立指數模型')
  }

  const b = base.coefs.a // slope in log space (already rounded, but use raw slope for calc)
  // recompute with raw values to avoid rounding error: use base's internal slope/intercept
  // base.coefs are rounded; better to use unrounded? We use rounded as before for consistency
  const lnA = base.coefs.b - b * mu // transform intercept back to original x
  const a = Math.exp(lnA)
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return createDegenerate('exponential', totalCount, usedCount, 'degenerate', '計算結果非有限值')
  }

  const coefs = { a: toPrecision(a), b: toPrecision(b) }
  const predict = (x: number) => {
    if (!Number.isFinite(x)) return null
    const y = a * Math.exp(b * x)
    return Number.isFinite(y) ? y : null
  }

  return {
    type: 'exponential',
    coefs,
    r2: coefficientOfDetermination(valid.map((p) => p.y), (i) => predict(valid[i].x) as number),
    formula: buildExponentialFormula(coefs),
    predict,
    totalCount,
    usedCount,
    excludedCount,
    status: 'ok',
  }
}

export function powerRegression(
  points: FitPoint[],
  _options: FitOptions = {},
): RegressionResult {
  const totalCount = points.length
  const finite = points.filter(isFinitePoint)
  const valid = finite.filter((p) => p.x > 0 && p.y > 0)
  const usedCount = valid.length
  const excludedCount = totalCount - usedCount
  if (usedCount < 2) {
    return createDegenerate('power', totalCount, usedCount, 'insufficient-data', `資料不足：冪函數擬合至少需要 2 筆 x>0 且 y>0 的有效資料（已排除 ${excludedCount} 筆）`)
  }

  // Center ln(x) values for numerical stability
  const logXs = valid.map((p) => Math.log(p.x))
  const mu = mean(logXs)
  const logPoints = valid.map((p, i) => ({
    x: logXs[i] - mu,
    y: Math.log(p.y),
  }))
  const base = linearRegression(logPoints)
  if (base.status !== 'ok' || !Number.isFinite(base.coefs.a) || !Number.isFinite(base.coefs.b)) {
    return createDegenerate('power', totalCount, usedCount, 'degenerate', base.reason ?? '無法建立冪函數模型')
  }

  const b = base.coefs.a // exponent
  const lnA = base.coefs.b - b * mu // transform intercept back
  const a = Math.exp(lnA)
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return createDegenerate('power', totalCount, usedCount, 'degenerate', '計算結果非有限值')
  }

  const coefs = { a: toPrecision(a), b: toPrecision(b) }
  const predict = (x: number) => {
    if (!Number.isFinite(x) || x <= 0) return null
    const y = a * Math.pow(x, b)
    return Number.isFinite(y) ? y : null
  }

  return {
    type: 'power',
    coefs,
    r2: coefficientOfDetermination(valid.map((p) => p.y), (i) => predict(valid[i].x)! as number),
    formula: buildPowerFormula(coefs),
    predict,
    totalCount,
    usedCount,
    excludedCount,
    status: 'ok',
  }
}

export function fitRegression(
  points: FitPoint[],
  type: RegressionType,
  options: FitOptions = {},
): RegressionResult {
  switch (type) {
    case 'linear':
      return linearRegression(points, options)
    case 'polynomial':
      return polynomialRegression(points, options)
    case 'exponential':
      return exponentialRegression(points, options)
    case 'power':
      return powerRegression(points, options)
  }
}

function createDegenerate(
  type: RegressionType,
  totalCount = 0,
  usedCount = 0,
  status: RegressionStatus = 'degenerate',
  reason = '資料不足，無法擬合',
): RegressionResult {
  // if caller passed totalCount but usedCount 0 and status was degenerate due to insufficient, keep as is
  // excludedCount derived
  const excludedCount = Math.max(0, totalCount - usedCount)
  return {
    type,
    formula: '資料不足，無法擬合',
    r2: NaN,
    coefs: {},
    predict: () => null,
    totalCount,
    usedCount,
    excludedCount,
    status,
    reason,
  }
}

// ---------- formula builders ----------

function buildLinearFormula({ a, b }: Record<string, number>): string {
  if (b === 0) return `y = ${formatNumber(a)}x`
  const bTerm = b > 0 ? `+ ${formatNumber(b)}` : `- ${formatNumber(Math.abs(b))}`
  return `y = ${formatNumber(a)}x ${bTerm}`
}

function buildPolynomialFormula({
  a,
  b,
  c,
}: Record<string, number>): string {
  const aPart = formatNumber(a)
  const bPart =
    b === 0 ? '' : `${b > 0 ? '+' : '-'} ${formatNumber(Math.abs(b))}x`
  const cPart =
    c === 0 ? '' : `${c > 0 ? '+' : '-'} ${formatNumber(Math.abs(c))}`
  return `y = ${aPart}x² ${bPart} ${cPart}`.replace(/\s+/g, ' ').trim()
}

function buildExponentialFormula({
  a,
  b,
}: Record<string, number>): string {
  return `y = ${formatNumber(a)}·e^(${formatNumber(b)}x)`
}

function buildPowerFormula({ a, b }: Record<string, number>): string {
  return `y = ${formatNumber(a)}·x^${formatNumber(b)}`
}

// ---------- error bars ----------

export type ErrorSource = 'field' | 'fixed' | 'percent' | 'se'

export type ErrorDirection = 'both' | 'plus' | 'minus'

export interface ErrorBarSettings {
  source: ErrorSource
  /** value used by fixed / percent sources */
  value: number
  /** per-point repeated measurements for the `se` source; sample SD (n-1) is used */
  repeated?: number[][]
}

export interface ErrorBarOutput {
  array: (number | null)[] | null
  symmetric: boolean
  arrayminus?: (number | null)[] | null
}

function computeStats(values: number[]): { sd: number; se: number; mean: number } {
  const m = mean(values)
  const n = values.length
  if (n < 2) return { sd: NaN, se: NaN, mean: m }
  let ss = 0
  for (const v of values) ss += (v - m) * (v - m)
  // sample SD (n-1), not population SD (n)
  const sd = Math.sqrt(ss / (n - 1))
  return { sd, se: sd / Math.sqrt(n), mean: m }
}

/**
 * Compute error-bar magnitudes for a vector of base values.
 *
 * - `field`: magnitudes come from the data columns; returns the given fieldArray.
 * - `fixed`: each magnitude equals `settings.value`.
 * - `percent`: each magnitude equals `base[i] * value / 100`.
 * - `se`: standard error (sample SD / √n) from repeated measurements; returns null if unavailable (no silent fallback).
 */
export function calculateErrorBars(
  baseValues: (number | null)[],
  settings: ErrorBarSettings,
  fieldArray: (number | null)[] | undefined,
): ErrorBarOutput {
  const result: ErrorBarOutput = { array: null, symmetric: true }

  if (settings.source === 'field') {
    if (!fieldArray) return result
    result.array = fieldArray
    return result
  }

  if (settings.source === 'fixed') {
    result.array = baseValues.map(() => settings.value)
    return result
  }

  if (settings.source === 'percent') {
    result.array = baseValues.map((v) =>
      v == null ? null : Math.abs(v) * (settings.value / 100),
    )
    return result
  }

  // source === 'se'
  if (
    settings.repeated &&
    settings.repeated.length > 0 &&
    settings.repeated.some((vals) => vals.length > 1)
  ) {
    result.array = settings.repeated.map((vals) => {
      if (!vals || vals.length <= 1) return null
      return computeStats(vals).se
    })
    return result
  }

  // No repeated measurements available — do NOT fall back silently.
  return result
}
