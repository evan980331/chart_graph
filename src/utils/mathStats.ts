export type RegressionType = 'linear' | 'polynomial' | 'exponential' | 'power'

export interface FitPoint {
  x: number
  y: number
}

export interface FitOptions {
  forceZeroIntercept?: boolean
}

export interface RegressionResult {
  type: RegressionType
  /** Human readable equation, e.g. "y = 9.81x + 0.02" */
  formula: string
  /** Coefficient of determination R² (0..1, on the original y scale) */
  r2: number
  /** Named coefficients (may vary per model) */
  coefs: Record<string, number>
  /** @returns fitted y for a given x, or null when x is outside the model domain */
  predict: (x: number) => number | null
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

function coefficientOfDetermination(
  ys: number[],
  predicted: (i: number) => number,
): number {
  const yMean = mean(ys)
  let ssRes = 0
  let ssTot = 0
  for (let i = 0; i < ys.length; i++) {
    const resid = ys[i] - predicted(i)
    ssRes += resid * resid
    ssTot += (ys[i] - yMean) * (ys[i] - yMean)
  }
  if (ssTot === 0) return Number.isFinite(ssRes) && Math.abs(ssRes) < 1e-12 ? 1 : 0
  return Math.max(0, Math.min(1, 1 - ssRes / ssTot))
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

/** Solve a symmetric 3x3 linear system A x = b for the quadratic case. */
function solveQuadraticSystem(rows: number[][]): number[] | null {
  const n = 3
  const a = rows.map((r) => [...r])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null
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
    x[r] = sum / a[r][r]
  }
  return x
}

// ---------- regression models ----------

export function linearRegression(
  points: FitPoint[],
  options: FitOptions = {},
): RegressionResult {
  const n = points.length
  if (n < 2) return createDegenerate('linear')

  const sx = mean(points.map((p) => p.x))
  const sy = mean(points.map((p) => p.y))

  let slope: number
  let intercept: number

  if (options.forceZeroIntercept) {
    let sumXY = 0
    let sumX2 = 0
    for (const p of points) {
      sumXY += p.x * p.y
      sumX2 += p.x * p.x
    }
    if (sumX2 === 0) return createDegenerate('linear')
    slope = sumXY / sumX2
    intercept = 0
  } else {
    let num = 0
    let den = 0
    for (const p of points) {
      num += (p.x - sx) * (p.y - sy)
      den += (p.x - sx) * (p.x - sx)
    }
    if (den === 0) return createDegenerate('linear')
    slope = num / den
    intercept = sy - slope * sx
  }

  const coefs = { a: toPrecision(slope), b: toPrecision(intercept) }
  const predict = (x: number) => slope * x + intercept

  return {
    type: 'linear',
    coefs,
    r2: coefficientOfDetermination(points.map((p) => p.y), (i) =>
      predict(points[i].x),
    ),
    formula: buildLinearFormula(coefs),
    predict,
  }
}

export function polynomialRegression(
  points: FitPoint[],
  options: FitOptions = {},
): RegressionResult {
  const n = points.length
  if (n < 3) return createDegenerate('polynomial')
  const xs = points.map((p) => p.x)

  let a: number
  let b: number
  let c: number

  if (options.forceZeroIntercept) {
    let s2 = 0
    let s3 = 0
    let s4 = 0
    let s2y = 0
    let sy1 = 0
    for (const p of points) {
      const x2 = p.x * p.x
      const x3 = x2 * p.x
      const x4 = x3 * p.x
      s2 += x2
      s3 += x3
      s4 += x4
      s2y += x2 * p.y
      sy1 += p.y
    }
    const det = s2 * s4 - s3 * s3
    if (det === 0) return createDegenerate('polynomial')
    // solve [[s2, s3],[s3, s4]] [c,b] = [sy1, s2y]
    b = (s4 * sy1 - s3 * s2y) / det
    c = (s2 * s2y - s3 * sy1) / det
    a = 0
  } else {
    const s0 = n
    const s1 = points.reduce((s, p) => s + p.x, 0)
    const s2 = points.reduce((s, p) => s + p.x * p.x, 0)
    const s3 = points.reduce((s, p) => s + p.x * p.x * p.x, 0)
    const s4 = points.reduce((s, p) => s + p.x ** 4, 0)
    const s1y = points.reduce((s, p) => s + p.x * p.y, 0)
    const s2y = points.reduce((s, p) => s + p.x * p.x * p.y, 0)
    const sy1 = points.reduce((s, p) => s + p.y, 0)

    const solved = solveQuadraticSystem([
      [s4, s3, s2, s2y],
      [s3, s2, s1, s1y],
      [s2, s1, s0, sy1],
    ])
    if (!solved) return createDegenerate('polynomial')
    a = solved[0]
    b = solved[1]
    c = solved[2]
  }

  const coefs = {
    a: toPrecision(a),
    b: toPrecision(b),
    c: toPrecision(c),
  }
  const predict = (x: number) => a * x * x + b * x + c

  return {
    type: 'polynomial',
    coefs,
    r2: coefficientOfDetermination(points.map((p) => p.y), (i) =>
      predict(xs[i]),
    ),
    formula: buildPolynomialFormula(coefs),
    predict,
  }
}

export function exponentialRegression(
  points: FitPoint[],
  options: FitOptions = {},
): RegressionResult {
  const valid = points.filter((p) => p.y > 0)
  if (valid.length < 2) return createDegenerate('exponential')

  const lnPoints = valid.map((p) => ({ x: p.x, y: Math.log(p.y) }))
  const base = linearRegression(lnPoints, options)
  if (!Number.isFinite(base.coefs.a) || !Number.isFinite(base.coefs.b))
    return createDegenerate('exponential')

  const b = base.coefs.a // slope in log space
  const lnA = base.coefs.b // intercept in log space
  const a = Math.exp(lnA)

  const coefs = { a: toPrecision(a), b: toPrecision(b) }
  const predict = (x: number) => a * Math.exp(b * x)

  return {
    type: 'exponential',
    coefs,
    r2: coefficientOfDetermination(valid.map((p) => p.y), (i) =>
      predict(valid[i].x),
    ),
    formula: buildExponentialFormula(coefs),
    predict,
  }
}

export function powerRegression(
  points: FitPoint[],
  options: FitOptions = {},
): RegressionResult {
  const valid = points.filter((p) => p.x > 0 && p.y > 0)
  if (valid.length < 2) return createDegenerate('power')

  const logPoints = valid.map((p) => ({
    x: Math.log(p.x),
    y: Math.log(p.y),
  }))
  const base = linearRegression(logPoints, options)
  if (!Number.isFinite(base.coefs.a) || !Number.isFinite(base.coefs.b))
    return createDegenerate('power')

  const b = base.coefs.a // exponent
  const lnA = base.coefs.b
  const a = Math.exp(lnA)

  const coefs = { a: toPrecision(a), b: toPrecision(b) }
  const predict = (x: number) => (x <= 0 ? null : a * Math.pow(x, b))

  return {
    type: 'power',
    coefs,
    r2: coefficientOfDetermination(valid.map((p) => p.y), (i) =>
      predict(valid[i].x)! as number,
    ),
    formula: buildPowerFormula(coefs),
    predict,
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

function createDegenerate(type: RegressionType): RegressionResult {
  return {
    type,
    formula: '資料不足，無法擬合',
    r2: NaN,
    coefs: {},
    predict: () => null,
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
  /** population of repeated measurements per point for the `se` source */
  repeated?: number[][]
}

export interface ErrorBarOutput {
  array: (number | null)[] | null
  symmetric: boolean
  arrayminus?: (number | null)[] | null
}

function computeStats(values: number[]): { sd: number; se: number; mean: number } {
  const m = mean(values)
  const variance = mean(values.map((v) => (v - m) * (v - m)))
  const sd = Math.sqrt(variance)
  const n = values.length
  return { sd, se: sd / Math.sqrt(n), mean: m }
}

/**
 * Compute error-bar magnitudes for a vector of base values.
 *
 * - `field`: not supported here (magnitudes come from the data columns); returns the given fieldArray.
 * - `fixed`: each magnitude equals `settings.value`.
 * - `percent`: each magnitude equals `base[i] * value / 100`.
 * - `se`: standard error from repeated measurements; if unavailable falls back to `fieldArray` or `percent`.
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

  const n = baseValues.length

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

  // No repeated measurements: fall back to the field error column, then percent
  if (fieldArray && fieldArray.length === n) {
    result.array = fieldArray
    return result
  }

  result.array = baseValues.map((v) =>
    v == null ? null : Math.abs(v) * (settings.value / 100),
  )
  return result
}
