import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
}: AccordionItemProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group border-b-2 border-neutral-300 last:border-b-0',
        className,
      )}
    >
      <summary className="sticky top-0 z-10 flex cursor-pointer select-none items-center justify-between border-b border-neutral-300 bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-neutral-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 bg-white px-4 pb-4 pt-3">{children}</div>
    </details>
  )
}

export function Accordion({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(className)}>{children}</div>
  )
}
