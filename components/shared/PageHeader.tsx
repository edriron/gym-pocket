import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Full static class strings for Tailwind JIT
const ICON_STYLES: Record<string, { wrapper: string; icon: string }> = {
  emerald: { wrapper: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-600 dark:text-emerald-400' },
  orange:  { wrapper: 'bg-orange-100 dark:bg-orange-900/40',   icon: 'text-orange-600 dark:text-orange-400' },
  violet:  { wrapper: 'bg-violet-100 dark:bg-violet-900/40',   icon: 'text-violet-600 dark:text-violet-400' },
  sky:     { wrapper: 'bg-sky-100 dark:bg-sky-900/40',         icon: 'text-sky-600 dark:text-sky-400' },
  amber:   { wrapper: 'bg-amber-100 dark:bg-amber-900/40',     icon: 'text-amber-600 dark:text-amber-400' },
  pink:    { wrapper: 'bg-pink-100 dark:bg-pink-900/40',       icon: 'text-pink-600 dark:text-pink-400' },
  teal:    { wrapper: 'bg-teal-100 dark:bg-teal-900/40',       icon: 'text-teal-600 dark:text-teal-400' },
}

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  icon?: LucideIcon
  iconColor?: keyof typeof ICON_STYLES
}

export function PageHeader({ title, description, action, className, icon: Icon, iconColor = 'emerald' }: PageHeaderProps) {
  const styles = ICON_STYLES[iconColor]

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', styles.wrapper)}>
            <Icon className={cn('size-5', styles.icon)} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
