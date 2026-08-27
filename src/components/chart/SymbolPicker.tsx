import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

const SYMBOLS = ['Δ', 'μ', '±', 'α', 'β', 'θ', 'π', 'R²', '°C', 'Ω']

interface SymbolPickerProps {
  onInsert: (symbol: string) => void
}

export function SymbolPicker({ onInsert }: SymbolPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setOpen(!open)}
        title="插入科學符號"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 grid w-48 grid-cols-5 gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg animate-in fade-in zoom-in-95">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded text-sm hover:bg-neutral-100"
              onClick={() => {
                onInsert(s)
                setOpen(false)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
