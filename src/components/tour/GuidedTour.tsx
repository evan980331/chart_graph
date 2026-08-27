import { useEffect, useRef } from 'react'
import { driver as createDriver, type DriverInstance } from 'driver.js'
import 'driver.js/dist/driver.css'

interface GuidedTourProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TOUR_STORAGE_KEY = 'labplot-tour-completed'

export function GuidedTour({ open, onOpenChange }: GuidedTourProps) {
  const driverRef = useRef<DriverInstance | null>(null)

  useEffect(() => {
    if (!open) {
      driverRef.current?.destroy()
      return
    }

    driverRef.current?.destroy()

    const drv = createDriver({
      animate: true,
      opacity: 0.7,
      padding: 10,
      allowClose: true,
      overlayClickNext: true,
      doneBtnText: '完成導覽',
      closeBtnText: '跳過',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      onDestroy: () => {
        onOpenChange(false)
      },
    })

    drv.setSteps([
      {
        element: '[data-tour="import"]',
        popover: {
          title: '第一步：匯入或貼上數據',
          description:
            '從左側面板匯入 CSV/Excel 檔案，或直接貼上從 Excel 複製的數據。你也可以手動輸入數據。',
          position: 'right',
        },
      },
      {
        element: '[data-tour="axis"]',
        popover: {
          title: '第二步：設定 X/Y 軸',
          description:
            '在右側「軸線標籤」區域設定 X 與 Y 軸的標籤名稱、單位、刻度範圍。點擊「常用符號」可快速插入 Δ、μ 等科學符號。',
          position: 'left',
        },
      },
      {
        element: '[data-tour="regression"]',
        popover: {
          title: '第三步：開啟回歸線/誤差棒',
          description:
            '在「回歸分析」面板啟用擬合曲線（線性、多項式等），在「誤差棒設定」面板加入 X/Y 方向的誤差棒。',
          position: 'left',
        },
      },
      {
        element: '[data-tour="export"]',
        popover: {
          title: '第四步：匯出高畫質向量圖',
          description:
            '在「匯出圖表」面板選擇 PNG（高解析度印刷）或 SVG（無損向量）格式，設定解析度後下載。',
          position: 'left',
        },
      },
    ])

    drv.drive()
    driverRef.current = drv
  }, [open, onOpenChange])

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => {
        onOpenChange(true)
        localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [onOpenChange])

  return null
}
