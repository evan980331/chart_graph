# LabPlot 科學圖表生成器

單機版學術科學圖表生成器：從 CSV / Excel / 剪貼簿貼入數據，即時產生符合學術發佈標準的向量圖表（Plotly SVG），並支援回歸分析、誤差棒與多圖表類型切換。

## 技術棧

- **前端框架**：React 18+ / Vite / TypeScript (strict)
- **UI**：Tailwind CSS + shadcn 風格元件 + Lucide Icons
- **圖表引擎**：Plotly.js (`plotly.js-dist-min`) + `react-plotly.js`（透過 factory 載入）
- **資料解析**：Papaparse (CSV)、SheetJS xlsx (Excel)
- **狀態管理**：Zustand
- **統計計算**：原生 TypeScript 實作回歸模型與誤差棒計算

## 功能

- 資料匯入：檔案拖曳（.csv / .xlsx）、剪貼簿貼上（Tab / 逗號分隔）、可編輯試算表
- 欄位映射：指定 X / Y / 誤差欄位，自動忽略無效資料並提示數量
- 圖表類型：散佈圖、折線圖、柱狀圖 動態切換
- 回歸分析：線性、二次多項式、指數、冪函數，含 R² 與方程式標註
- 誤差棒：資料欄位 / 固定值 / 百分比 / 標準誤 SE，方向與樣式設定
- 高解析度 SVG 匯出

## 開發

```bash
npm install
npm run dev       # 開發伺服器
npm run typecheck # TypeScript 型別檢查
npm test          # 單元測試
npm run lint      # oxlint
npm run build     # 生產建置
```

## 部署（Vercel）

專案已含 `vercel.json`（SPA 路由重寫至 `index.html`）。Push 到 GitHub 後可直接在 Vercel 匯入部署。

## 專案結構

```
src/
├── components/
│   ├── layout/       # Header, MainLayout
│   ├── data/         # DataImporter, DataPanel, ColumnMapper
│   ├── chart/        # ScientificChart, RegressionPanel, ErrorBarPanel, StylePanel
│   └── ui/           # Button, Input, Select, Label, Switch, Accordion
├── stores/           # useChartStore (Zustand)
├── types/            # chart.ts, analysis.ts
└── utils/            # fileParser.ts, mathStats.ts (+ .test.ts)
```
