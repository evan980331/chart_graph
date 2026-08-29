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
  /** Breakdown of why points were excluded (e.g. "non-finite": 2, "y ≤ 0": 1) */
  exclusionReasons: Record<string, number>
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

// ---------- internal raw linear fit (no rounding) ----------
function linearFitRaw(
  points: FitPoint[],
  forceZeroIntercept = false,
): { slope: number; intercept: number } | { degenerate: true; reason: string } {
  if (points.length < 2) return { degenerate: true, reason: 'insufficient' }
  if (forceZeroIntercept) {
    let sumXY = 0
    let sumX2 = 0
    for (const p of points) {
      sumXY += p.x * p.y
      sumX2 += p.x * p.x
    }
    if (sumX2 === 0) return { degenerate: true, reason: 'X values are identical or all zero, cannot fit with zero intercept' }
    const slope = sumXY / sumX2
    if (!Number.isFinite(slope)) return { degenerate: true, reason: '計算結果非有限值' }
    return { slope, intercept: 0 }
  }
  const sx = mean(points.map((p) => p.x))
  const sy = mean(points.map((p) => p.y))
  let num = 0
  let den = 0
  for (const p of points) {
    num += (p.x - sx) * (p.y - sy)
    den += (p.x - sx) * (p.x - sx)
  }
  if (den === 0) return { degenerate: true, reason: 'X values are identical' }
  const slope = num / den
  const intercept = sy - slope * sx
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) return { degenerate: true, reason: '計算結果非有限值' }
  return { slope, intercept }
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
  const exclusionReasons: Record<string, number> = {}
  if (excludedCount > 0) exclusionReasons['non-finite'] = excludedCount
  if (usedCount < 2) {
    return createDegenerate('linear', totalCount, usedCount, 'insufficient-data', '資料不足：線性擬合至少需要 2 筆有效資料', exclusionReasons)
  }

  const raw = linearFitRaw(finite, !!options.forceZeroIntercept)
  if ('degenerate' in raw) {
    return createDegenerate('linear', totalCount, usedCount, 'degenerate', raw.reason, exclusionReasons)
  }
  const { slope, intercept } = raw

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
    exclusionReasons,
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
  const exclusionReasons: Record<string, number> = {}
  if (excludedCount > 0) exclusionReasons['non-finite'] = excludedCount
  if (usedCount < 3) {
    return createDegenerate('polynomial', totalCount, usedCount, 'insufficient-data', '資料不足：二次擬合至少需要 3 筆有效資料', exclusionReasons)
  }
  const xs = finite.map((p) => p.x)

  let a: number
  let b: number
  let c: number

  if (options.forceZeroIntercept) {
    // y = a*x² + b*x (c = 0) — scale-aware 2×2 solver preserving zero-intercept constraint
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
    // scale by sigma = sqrt(s2/n) to avoid extreme det magnitudes while keeping c=0
    const sigma = s2 === 0 ? 1 : Math.sqrt(s2 / usedCount)
    const s2u = s2 / (sigma * sigma)
    const s3u = s3 / (sigma * sigma * sigma)
    const s4u = s4 / (sigma * sigma * sigma * sigma)
    const s1yu = s1y / sigma
    const s2yu = s2y / (sigma * sigma)
    const detU = s4u * s2u - s3u * s3u
    const scaleU = Math.max(Math.abs(s4u * s2u), Math.abs(s3u * s3u))
    if (scaleU === 0 || Math.abs(detU) <= 1e-12 * scaleU) {
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', 'X values are degenerate, cannot solve quadratic system', exclusionReasons)
    }
    const Au = (s2u * s2yu - s3u * s1yu) / detU // A = a*sigma²
    const Bu = (s4u * s1yu - s3u * s2yu) / detU // B = b*sigma
    a = Au / (sigma * sigma)
    b = Bu / sigma
    c = 0
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', '計算結果非有限值', exclusionReasons)
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
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', 'X values are degenerate, cannot solve quadratic system', exclusionReasons)
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
      return createDegenerate('polynomial', totalCount, usedCount, 'degenerate', '計算結果非有限值', exclusionReasons)
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
    exclusionReasons,
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
  const exclusionReasonsExp: Record<string, number> = {}
  if (nonFiniteExcluded > 0) exclusionReasonsExp['non-finite'] = nonFiniteExcluded
  if (domainExcluded > 0) exclusionReasonsExp['y ≤ 0'] = domainExcluded
  if (usedCount < 2) {
    const reason = nonFiniteExcluded > 0 || domainExcluded > 0
      ? `資料不足：指數擬合至少需要 2 筆 y>0 的有效資料（已排除 ${excludedCount} 筆）`
      : '資料不足：指數擬合至少需要 2 筆 y>0 的有效資料'
    return createDegenerate('exponential', totalCount, usedCount, 'insufficient-data', reason, exclusionReasonsExp)
  }

  // Center x values for numerical stability — use raw linear fit, no rounding
  const mu = mean(valid.map((p) => p.x))
  const lnPoints = valid.map((p) => ({ x: p.x - mu, y: Math.log(p.y) }))
  const baseRaw = linearFitRaw(lnPoints, false)
  if ('degenerate' in baseRaw) {
    return createDegenerate('exponential', totalCount, usedCount, 'degenerate', baseRaw.reason ?? '無法建立指數模型', exclusionReasonsExp)
  }
  const b = baseRaw.slope
  const lnA = baseRaw.intercept - b * mu // transform intercept back to original x
  const a = Math.exp(lnA)
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return createDegenerate('exponential', totalCount, usedCount, 'degenerate', '計算結果非有限值', exclusionReasonsExp)
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
    exclusionReasons: exclusionReasonsExp,
  }
}

export function powerRegression(
  points: FitPoint[],
  _options: FitOptions = {},
): RegressionResult {
  const totalCount = points.length
  const finite = points.filter(isFinitePoint)
  const nonFinite = totalCount - finite.length
  const valid = finite.filter((p) => p.x > 0 && p.y > 0)
  const usedCount = valid.length
  const excludedCount = totalCount - usedCount
  const exclusionReasonsPow: Record<string, number> = {}
  if (nonFinite > 0) exclusionReasonsPow['non-finite'] = nonFinite
  let xLTE0 = 0, yLTE0 = 0
  for (const p of finite) {
    if (p.x <= 0) xLTE0++
    if (p.y <= 0) yLTE0++
  }
  // only count domain failures that were actually finite but invalid for power
  if (xLTE0 > 0) exclusionReasonsPow['x ≤ 0'] = xLTE0
  if (yLTE0 > 0) exclusionReasonsPow['y ≤ 0'] = yLTE0
  if (usedCount < 2) {
    return createDegenerate('power', totalCount, usedCount, 'insufficient-data', `資料不足：冪函數擬合至少需要 2 筆 x>0 且 y>0 的有效資料（已排除 ${excludedCount} 筆）`, exclusionReasonsPow)
  }

  // Center ln(x) values for numerical stability — use raw linear fit
  const logXs = valid.map((p) => Math.log(p.x))
  const mu = mean(logXs)
  const logPoints = valid.map((p, i) => ({
    x: logXs[i] - mu,
    y: Math.log(p.y),
  }))
  const baseRaw = linearFitRaw(logPoints, false)
  if ('degenerate' in baseRaw) {
    return createDegenerate('power', totalCount, usedCount, 'degenerate', baseRaw.reason ?? '無法建立冪函數模型', exclusionReasonsPow)
  }
  const b = baseRaw.slope // exponent
  const lnA = baseRaw.intercept - b * mu // transform intercept back
  const a = Math.exp(lnA)
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return createDegenerate('power', totalCount, usedCount, 'degenerate', '計算結果非有限值', exclusionReasonsPow)
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
    exclusionReasons: exclusionReasonsPow,
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
  exclusionReasons: Record<string, number> = {},
): RegressionResult {
  const excludedCount = Math.max(0, totalCount - usedCount)
  // if caller provided empty but there is excluded, fill generic non-finite/domain
  const reasons = Object.keys(exclusionReasons).length > 0 ? exclusionReasons : (excludedCount > 0 ? { 'non-finite': excludedCount } : {})
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
    exclusionReasons: reasons,
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

export function computeStats(values: number[]): { sd: number; se: number; mean: number } {
  const m = mean(values)
  const n = values.length
  // n=1: sample SD/SE undefined (not 0) — do not fallback
  if (n < 2) return { sd: NaN, se: NaN, mean: m }
  let ss = 0
  for (const v of values) ss += (v - m) * (v - m)
  // Sample Standard Deviation (n-1), Standard Error of the Mean = s / √n
  const sd = Math.sqrt(ss / (n - 1))
  return { sd, se: sd / Math.sqrt(n), mean: m }
}

/**
 * Group points by X for repeated-measurements SE.
 * Different X must NOT be treated as repeated of same condition.
 * Example: X=1 → [2,3,4], X=2 → [5,6,7] each have n=3.
 * rawData is long-format; this helper derives per-X groups without mutating rawData.
 */
export function groupByX(points: FitPoint[]): Map<number, number[]> {
  const m = new Map<number, number[]>()
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
    const arr = m.get(p.x)
    if (arr) arr.push(p.y)
    else m.set(p.x, [p.y])
  }
  return m
}

/** Compute SE per unique X using sample SD. Returns Map<X, SE>. */
export function calculateGroupedSE(points: FitPoint[]): Map<number, number> {
  const groups = groupByX(points)
  const out = new Map<number, number>()
  for (const [x, ys] of groups) {
    if (ys.length < 2) continue // n=1 undefined, skip
    const { se } = computeStats(ys)
    if (Number.isFinite(se)) out.set(x, se)
  }
  return out
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
