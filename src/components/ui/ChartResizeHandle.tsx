import { useRef } from 'react'

interface ChartResizeHandleProps {
  width: number
  height: number
  onResize: (width: number, height: number) => void
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export function ChartResizeHandle({
  width,
  height,
  onResize,
  minW = 320,
  minH = 240,
  maxW = 2400,
  maxH = 1600,
}: ChartResizeHandleProps) {
  const start = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    start.current = { x: e.clientX, y: e.clientY, w: width, h: height }

    const move = (ev: PointerEvent) => {
      const s = start.current
      if (!s) return
      const dw = ev.clientX - s.x
      const dh = ev.clientY - s.y
      const nw = Math.min(maxW, Math.max(minW, Math.round(s.w + dw)))
      const nh = Math.min(maxH, Math.max(minH, Math.round(s.h + dh)))
      onResize(nw, nh)
    }
    const up = () => {
      start.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    document.body.style.cursor = 'nwse-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div
      onPointerDown={onPointerDown}
      title="拖曳調整預覽大小"
      style={{ touchAction: 'none' }}
      className="absolute bottom-0 right-0 z-20 flex h-5 w-5 cursor-nwse-resize items-end justify-end bg-neutral-200/80 hover:bg-neutral-300"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" className="text-neutral-600">
        <path
          d="M11 4 L4 11 M11 8 L8 11"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
