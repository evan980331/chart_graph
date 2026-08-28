import { useEffect, useRef, useState } from 'react'
import { Input } from './input'

interface NumberInputProps {
  value: number | undefined
  min?: number
  max?: number
  step?: number
  /** 允許空白（對應 undefined），例如軸範圍/間距 */
  allowUndefined?: boolean
  onChange: (value: number | undefined) => void
  className?: string
  id?: string
  placeholder?: string
}

function clamp(v: number, min?: number, max?: number) {
  let r = v
  if (min !== undefined) r = Math.max(min, r)
  if (max !== undefined) r = Math.min(max, r)
  return r
}

export function NumberInput({
  value,
  min,
  max,
  step,
  allowUndefined = false,
  onChange,
  className,
  id,
  placeholder,
}: NumberInputProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  const editing = useRef(false)

  useEffect(() => {
    if (!editing.current) {
      setText(value === undefined ? '' : String(value))
    }
  }, [value])

  return (
    <Input
      id={id}
      type="number"
      className={className}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={text}
      onFocus={() => {
        editing.current = true
        setText(value === undefined ? '' : String(value))
      }}
      onChange={(e) => {
        const t = e.target.value
        setText(t)
        if (t === '') {
          if (allowUndefined) onChange(undefined)
          return
        }
        const n = Number(t)
        if (!Number.isFinite(n)) return
        if (min !== undefined && n < min) return
        if (max !== undefined && n > max) return
        onChange(n)
      }}
      onBlur={() => {
        editing.current = false
        if (text === '') {
          if (!allowUndefined) setText(value === undefined ? '' : String(value))
          return
        }
        const n = Number(text)
        if (!Number.isFinite(n)) {
          setText(value === undefined ? '' : String(value))
          return
        }
        const c = clamp(n, min, max)
        onChange(c)
        setText(String(c))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          editing.current = false
          setText(value === undefined ? '' : String(value))
        }
      }}
    />
  )
}
