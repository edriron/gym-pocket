import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Full static class strings for Tailwind JIT
const ICON_STYLES: Record<string, { wrapper: string; icon: string }> = {
  emerald: { wrapper: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-500 dark:text-emerald-400' },
  orange:  { wrapper: 'bg-orange-100 dark:bg-orange-900/40',   icon: 'text-orange-500 dark:text-orange-400' },
  violet:  { wrapper: 'bg-violet-100 dark:bg-violet-900/40',   icon: 'text-violet-500 dark:text-violet-400' },
  sky:     { wrapper: 'bg-sky-100 dark:bg-sky-900/40',         icon: 'text-sky-500 dark:text-sky-400' },
  amber:   { wrapper: 'bg-amber-100 dark:bg-amber-900/40',     icon: 'text-amber-500 dark:text-amber-400' },
  pink:    { wrapper: 'bg-pink-100 dark:bg-pink-900/40',       icon: 'text-pink-500 dark:text-pink-400' },
  muted:   { wrapper: 'bg-muted',                               icon: 'text-muted-foreground' },
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  iconColor?: keyof typeof ICON_STYLES
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconColor = 'muted',
}: EmptyStateProps) {
  const styles = ICON_STYLES[iconColor]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-10 text-center',
        className
      )}
    >
      <div className={cn('flex size-16 items-center justify-center rounded-2xl', styles.wrapper)}>
        <Icon className={cn('size-8', styles.icon)} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
