import type { RawRow } from '@/utils/fileParser'
import type { Subject, TemplateConfig } from '@/types/template'
import type { ChartType } from '@/types/chart'
import {
  DEFAULT_REGRESSION,
  DEFAULT_ERROR_BAR,
  type ErrorBarConfig,
  type RegressionSettings,
} from '@/types/analysis'
import { DEFAULT_STYLE_CONFIG, type ChartStyleConfig } from '@/types/style'

function rows(columns: string[], values: (string | number)[][]): RawRow[] {
  return values.map((vals) => {
    const row: RawRow = {}
    columns.forEach((col, i) => (row[col] = vals[i] ?? null))
    return row
  })
}

function rowsWithError(
  columns: string[],
  values: (string | number)[][],
  yErrCol: string,
  yErr: (i: number) => number,
): RawRow[] {
  return values.map((vals, i) => {
    const row: RawRow = {}
    columns.forEach((col, j) => (row[col] = vals[j] ?? null))
    row[yErrCol] = yErr(i)
    return row
  })
}

function reg(patch: Partial<RegressionSettings>): RegressionSettings {
  return { ...DEFAULT_REGRESSION, ...patch }
}

function errBar(patch: Partial<ErrorBarConfig>): ErrorBarConfig {
  return {
    x: { ...DEFAULT_ERROR_BAR.x },
    y: { ...DEFAULT_ERROR_BAR.y },
    ...patch,
  }
}

function style(patch: Partial<ChartStyleConfig>): ChartStyleConfig {
  return { ...DEFAULT_STYLE_CONFIG, ...patch }
}

const templates: TemplateConfig[] = [
  // ===================== 物理 =====================
  {
    id: 'physics-hooke',
    title: '胡克定律測彈簧常數',
    subject: 'physics',
    description: '測量彈簧受力與伸長量關係，利用散佈圖與過原點線性擬合求出彈簧常數 k。',
    tags: ['線性擬合', '過原點', '彈簧常數'],
    icon: 'spring',
    data: rows(['伸長量 x (cm)', '力 F (N)'], [
      [0.5, 9.8],
      [1.0, 19.9],
      [1.5, 30.1],
      [2.0, 40.0],
      [2.5, 50.2],
      [3.0, 60.1],
      [3.5, 69.9],
      [4.0, 80.0],
    ]),
    mapping: { xAxis: '伸長量 x (cm)', yAxis: '力 F (N)' },
    chartType: 'scatter',
    config: {
      title: '胡克定律：彈簧伸長量與受力關係',
      xAxis: { label: '伸長量', unit: 'cm', min: 0, max: 4.5, step: 0.5 },
      yAxis: { label: '力', unit: 'N', min: 0, max: 90, step: 10 },
      showGrid: true,
    },
    regression: reg({ enabled: true, type: 'linear', forceZeroIntercept: true, lineWidth: 1.8 }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },
  {
    id: 'physics-fall-vt',
    title: '自由落體 v-t 圖',
    subject: 'physics',
    description: '描繪 v-t 點對並計算重力加速度 g (約 9.8 m/s²)，進行線性擬合。',
    tags: ['線性擬合', '重力加速度 g'],
    icon: 'fall',
    data: rows(['時間 t (s)', '速度 v (m/s)'], [
      [0.10, 0.98],
      [0.20, 1.96],
      [0.30, 2.95],
      [0.40, 3.92],
      [0.50, 4.91],
      [0.60, 5.88],
      [0.70, 6.86],
      [0.80, 7.84],
      [0.90, 8.83],
      [1.00, 9.81],
    ]),
    mapping: { xAxis: '時間 t (s)', yAxis: '速度 v (m/s)' },
    chartType: 'scatter',
    config: {
      title: '自由落體：速度—時間關係',
      xAxis: { label: '時間', unit: 's', min: 0, max: 1.1, step: 0.1 },
      yAxis: { label: '速度', unit: 'm/s', min: 0, max: 11, step: 1 },
      showGrid: true,
    },
    regression: reg({ enabled: true, type: 'linear', forceZeroIntercept: true, lineWidth: 1.8 }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },

  // ===================== 化學 =====================
  {
    id: 'chem-titration',
    title: '酸鹼滴定曲線',
    subject: 'chemistry',
    description: '強酸強鹼滴定 pH-體積關係，觀察 pH 突躍區間。',
    tags: ['滴定曲線', 'pH 變化'],
    icon: 'flask',
    data: rows(['滴定體積 V (mL)', 'pH'], [
      [0, 1.0],
      [5, 1.2],
      [10, 1.3],
      [15, 1.6],
      [20, 2.0],
      [22, 2.4],
      [24, 3.2],
      [24.5, 3.9],
      [25, 7.0],
      [25.5, 10.1],
      [26, 10.8],
      [28, 11.6],
      [30, 12.0],
      [40, 12.5],
      [50, 12.8],
    ]),
    mapping: { xAxis: '滴定體積 V (mL)', yAxis: 'pH' },
    chartType: 'line',
    config: {
      title: '強酸強鹼滴定：pH 滴定曲線',
      xAxis: { label: '滴定體積', unit: 'mL', min: 0, max: 55, step: 5 },
      yAxis: { label: 'pH', unit: '', min: 0, max: 14, step: 2 },
      showGrid: true,
    },
    regression: reg({ enabled: false }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },
  {
    id: 'chem-rate-decay',
    title: '反應速率與濃度 (c-t圖)',
    subject: 'chemistry',
    description: '一級反應物濃度隨時間遞減，透過指數擬合求反應速率常數 k。',
    tags: ['反應速率', '指數衰減'],
    icon: 'flask',
    data: rows(['時間 t (min)', '濃度 c (mol/L)'], [
      [0, 1.000],
      [2, 0.818],
      [4, 0.670],
      [6, 0.549],
      [8, 0.449],
      [10, 0.368],
      [12, 0.301],
      [14, 0.247],
      [16, 0.202],
      [18, 0.165],
      [20, 0.135],
    ]),
    mapping: { xAxis: '時間 t (min)', yAxis: '濃度 c (mol/L)' },
    chartType: 'line',
    config: {
      title: '一級反應：反應物濃度隨時間衰減',
      xAxis: { label: '時間', unit: 'min', min: 0, max: 22, step: 2 },
      yAxis: { label: '濃度', unit: 'mol/L', min: 0, max: 1.1, step: 0.1 },
      showGrid: true,
    },
    regression: reg({ enabled: true, type: 'exponential', forceZeroIntercept: false, lineWidth: 1.6 }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },
  {
    id: 'chem-beerlambert',
    title: '比爾朗伯定律',
    subject: 'chemistry',
    description: '吸光度與濃度成正比，A = εlc，進行線性擬合。',
    tags: ['線性擬合', '光譜分析'],
    icon: 'flask',
    data: rows(['濃度 c (mmol/L)', '吸光度 A'], [
      [0.0, 0.000],
      [0.2, 0.180],
      [0.4, 0.361],
      [0.6, 0.542],
      [0.8, 0.723],
      [1.0, 0.902],
      [1.2, 1.085],
      [1.4, 1.266],
    ]),
    mapping: { xAxis: '濃度 c (mmol/L)', yAxis: '吸光度 A' },
    chartType: 'scatter',
    config: {
      title: '比爾—朗伯定律：吸光度與濃度關係',
      xAxis: { label: '濃度', unit: 'mmol/L', min: 0, max: 1.6, step: 0.2 },
      yAxis: { label: '吸光度', unit: 'A', min: 0, max: 1.4, step: 0.2 },
      showGrid: true,
    },
    regression: reg({ enabled: true, type: 'linear', forceZeroIntercept: true, lineWidth: 1.8 }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },

  // ===================== 生物 =====================
  {
    id: 'bio-enzyme-temp',
    title: '酵素活性與溫度關係圖',
    subject: 'biology',
    description: '探討環境溫度對酵素活性影響，帶 SD 誤差棒柱狀圖（最適溫度約 40°C）。',
    tags: ['酵素活性', '誤差棒 SD', '最適溫度'],
    icon: 'leaf',
    data: rowsWithError(
      ['溫度 T (°C)', '酵素活性 (AU)', 'SD'],
      [
        [10, 12],
        [20, 28],
        [30, 52],
        [37, 78],
        [45, 90],
        [55, 62],
        [65, 25],
        [75, 8],
      ],
      'SD',
      (i) => [2, 3, 4, 5, 5, 5, 4, 2][i],
    ),
    mapping: { xAxis: '溫度 T (°C)', yAxis: '酵素活性 (AU)', yError: 'SD' },
    chartType: 'bar',
    config: {
      title: '溫度對酵素活性的影響',
      xAxis: { label: '溫度', unit: '°C', min: 5, max: 80, step: 10 },
      yAxis: { label: '酵素活性', unit: 'AU', min: 0, max: 100, step: 10 },
      showGrid: true,
    },
    regression: reg({ enabled: false }),
    errorBar: errBar({
      y: { ...DEFAULT_ERROR_BAR.y, source: 'field', color: '#000000', capSize: 4, thickness: 1 },
    }),
    styleConfig: style({}),
  },
  {
    id: 'bio-enzyme-ph',
    title: '酵素活性與 pH 值關係圖',
    subject: 'biology',
    description: '不同 pH 下的酵素活性，帶 SD 誤差棒柱狀圖（最適 pH 約 7）。',
    tags: ['酵素活性', '誤差棒 SD', '最適 pH'],
    icon: 'leaf',
    data: rowsWithError(
      ['pH', '酵素活性 (AU)', 'SD'],
      [
        [2, 8],
        [3, 15],
        [4, 30],
        [5, 55],
        [6, 82],
        [7, 100],
        [8, 78],
        [9, 48],
        [10, 20],
      ],
      'SD',
      (i) => [2, 3, 4, 5, 6, 6, 5, 4, 3][i],
    ),
    mapping: { xAxis: 'pH', yAxis: '酵素活性 (AU)', yError: 'SD' },
    chartType: 'bar',
    config: {
      title: 'pH 值對酵素活性的影響',
      xAxis: { label: 'pH', unit: '', min: 1, max: 11, step: 1 },
      yAxis: { label: '酵素活性', unit: 'AU', min: 0, max: 110, step: 10 },
      showGrid: true,
    },
    regression: reg({ enabled: false }),
    errorBar: errBar({
      y: { ...DEFAULT_ERROR_BAR.y, source: 'field', color: '#000000', capSize: 4, thickness: 1 },
    }),
    styleConfig: style({}),
  },
  {
    id: 'bio-population',
    title: '族群成長曲線 (S型)',
    subject: 'biology',
    description: '探討族群數量隨時間演變，呈現環境阻力下的 S 型成長曲線。',
    tags: ['S 型成長', '族群生態'],
    icon: 'leaf',
    data: rows(['時間 t (天)', '族群數量 N (×10²)'], [
      [0, 1],
      [2, 2],
      [4, 4],
      [6, 8],
      [8, 16],
      [10, 31],
      [12, 58],
      [14, 92],
      [16, 122],
      [18, 143],
      [20, 156],
      [22, 163],
      [24, 168],
      [26, 170],
      [28, 171],
      [30, 172],
    ]),
    mapping: { xAxis: '時間 t (天)', yAxis: '族群數量 N (×10²)' },
    chartType: 'line',
    config: {
      title: '酵母菌族群邏輯斯成長曲線',
      xAxis: { label: '時間', unit: '天', min: 0, max: 32, step: 4 },
      yAxis: { label: '族群數量', unit: '×10²', min: 0, max: 190, step: 20 },
      showGrid: true,
    },
    regression: reg({ enabled: false }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },

  // ===================== 地科 =====================
  {
    id: 'earth-temp-altitude',
    title: '對流層溫度隨高度遞減',
    subject: 'chemistry', // earth
    description: '探討大氣對流層溫度隨高度遞減關係（平均氣溫遞減率約 6.5 °C/km）。',
    tags: ['線性擬合', '大氣結構'],
    icon: 'globe',
    data: rows(['高度 h (km)', '溫度 T (°C)'], [
      [0, 15.0],
      [2, 2.0],
      [4, -11.0],
      [6, -24.0],
      [8, -37.0],
      [10, -50.0],
      [12, -56.5],
    ]),
    mapping: { xAxis: '高度 h (km)', yAxis: '溫度 T (°C)' },
    chartType: 'scatter',
    config: {
      title: '對流層大氣溫度隨高度遞減',
      xAxis: { label: '高度', unit: 'km', min: 0, max: 13, step: 1 },
      yAxis: { label: '溫度', unit: '°C', min: -60, max: 20, step: 10 },
      showGrid: true,
    },
    regression: reg({ enabled: true, type: 'linear', forceZeroIntercept: false, lineWidth: 1.8 }),
    errorBar: errBar({}),
    styleConfig: style({}),
  },
]

export function templatesBySubject(subject: Subject): TemplateConfig[] {
  return templates.filter((t) => t.subject === subject)
}

export const allTemplates: TemplateConfig[] = templates
export default templates
