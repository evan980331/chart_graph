import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  dataTour?: string
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
  dataTour,
}: AccordionItemProps) {
  return (
    <details
      open={defaultOpen}
      data-tour={dataTour}
      className={cn(
        'group border-b border-neutral-200 last:border-b-0',
        className,
      )}
    >
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-4 pb-4">{children}</div>
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
    <div className={cn('divide-y divide-neutral-200', className)}>
      {children}
    </div>
  )
}
