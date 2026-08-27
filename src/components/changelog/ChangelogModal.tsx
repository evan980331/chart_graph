import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChangelogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ENTRIES = [
  {
    version: 'v1.0.0-beta',
    date: '2026-08-27',
    changes: [
      '新增研究型圖表模板庫（物理/化學/生物各學科模板）',
      '新增 Undo/Redo 歷史紀錄（Ctrl+Z / Ctrl+Shift+Z）',
      '新增科學符號快速插入面板（Δ, μ, ±, R², °C, Ω）',
      '新增使用者反饋回報對話框',
      '優化響應式佈局，平板自動切換頁籤檢視',
      '新增數字輸入框失焦驗證，防止無效輸入',
      'Plotly Code Splitting 優化首屏載入',
      'PWA 離線支援，斷網仍可使用',
      'SEO / Open Graph 社群分享優化',
    ],
  },
  {
    version: 'v0.1.0-alpha',
    date: '2026-08-10',
    changes: [
      '首版 MVP：散佈圖/折線圖/柱狀圖',
      'CSV/Excel/貼上匯入數據',
      '回歸分析（線性/多項式/指數/對數）',
      '誤差棒設定',
      '高解析度 PNG/SVG 匯出',
      '專案存檔/讀檔 (.labplot)',
    ],
  },
]

export function ChangelogModal({ open, onOpenChange }: ChangelogModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-6">
          <h2 className="text-base font-semibold text-neutral-900">
            更新日誌
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 space-y-6 overflow-y-auto p-6">
          {ENTRIES.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {entry.version}
                </span>
                <span className="text-xs text-neutral-400">{entry.date}</span>
              </div>
              <ul className="mt-2 space-y-1 pl-1">
                {entry.changes.map((c, i) => (
                  <li key={i} className="text-sm text-neutral-700">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-neutral-200 bg-neutral-50 px-6 py-3.5">
          <Button size="sm" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
        </div>
      </div>
    </div>
  )
}
