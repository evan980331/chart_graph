import { useEffect, useState } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { getToasts, subscribeToasts, type ToastMessage } from '@/utils/toast'
import { cn } from '@/utils/cn'

const STYLES: Record<ToastMessage['kind'], { icon: 'check' | 'error' | 'info'; box: string }> = {
  success: { icon: 'check', box: 'border-green-300 bg-green-50 text-green-800' },
  error: { icon: 'error', box: 'border-red-300 bg-red-50 text-red-800' },
  info: { icon: 'info', box: 'border-neutral-300 bg-white text-neutral-800' },
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>(getToasts())

  useEffect(() => subscribeToasts(setToasts), [])

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => {
        const s = STYLES[t.kind]
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-[calc(100vw-2rem)] max-w-sm items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg',
              s.box,
            )}
            role="status"
          >
            {s.icon === 'check' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {s.icon === 'error' && <XCircle className="h-4 w-4 shrink-0" />}
            {s.icon === 'info' && <Info className="h-4 w-4 shrink-0" />}
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
