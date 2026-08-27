import { X, BookOpen, Code2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeaturesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FEATURES = [
  {
    icon: BookOpen,
    title: '符合 108 課綱與小論文規範',
    desc: '物理、化學、生物、地科四大學科標準模板，所有單位標籤與擬合模型均符合高中探究實作要求。',
  },
  {
    icon: Code2,
    title: '免安裝免寫程式',
    desc: '打開瀏覽器即可使用，匯入 CSV/Excel 或直接貼上數據，無需安裝任何軟體或撰寫 Python/R 程式碼。',
  },
  {
    icon: Download,
    title: '支援 300 DPI 向量圖匯出',
    desc: '匯出 SVG 無損向量圖或高解析度 PNG（最高 3× 縮放），可直接用於科展海报、小論文與報告。',
  },
]

export function FeaturesModal({ open, onOpenChange }: FeaturesModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-6">
          <h2 className="text-base font-semibold text-neutral-900">
            關於 LabPlot
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm text-neutral-600">
            LabPlot 是專為高中生設計的免費線上科學圖表工具，讓你不用寫任何程式碼，也能製作出符合學術規範的專業圖表。
          </p>

          <div className="grid gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-lg border border-neutral-200 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-neutral-200 bg-neutral-50 px-6 py-3.5">
          <Button size="sm" onClick={() => onOpenChange(false)}>
            知道了
          </Button>
        </div>
      </div>
    </div>
  )
}
