import { useCallback, useRef } from 'react'
import { cn } from '@/utils/cn'

interface ResizerProps {
  orientation: 'vertical' | 'horizontal'
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  ariaLabel?: string
}

export function Resizer({
  orientation,
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: ResizerProps) {
  const startRef = useRef<{ pos: number; val: number } | null>(null)

  const isVertical = orientation === 'vertical'

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      startRef.current = {
        pos: isVertical ? e.clientX : e.clientY,
        val: value,
      }

      const move = (ev: PointerEvent) => {
        const start = startRef.current
        if (!start) return
        const cur = isVertical ? ev.clientX : ev.clientY
        const delta = cur - start.pos
        const next = isVertical ? start.val + delta : start.val - delta
        onChange(Math.min(max, Math.max(min, next)))
      }
      const up = () => {
        startRef.current = null
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [isVertical, value, min, max, onChange],
  )

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      className={cn(
        'group relative z-10 shrink-0 bg-neutral-200 transition-colors hover:bg-neutral-400',
        isVertical ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
      )}
    >
      {/* 擴大點擊/拖曳命中區域 */}
      <div
        className={cn(
          'absolute',
          isVertical ? '-left-1.5 -right-1.5 inset-y-0' : '-top-1.5 -bottom-1.5 inset-x-0',
        )}
      />
    </div>
  )
}
