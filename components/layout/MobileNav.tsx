'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MOBILE_NAV_ITEMS } from '@/lib/constants'

const NAV_ACCENT: Record<string, { idle: string; active: string; dot: string }> = {
  '/dashboard': {
    idle:   'text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400',
    active: 'text-violet-600 dark:text-violet-400',
    dot:    'bg-violet-500',
  },
  '/weight': {
    idle:   'text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400',
    active: 'text-sky-600 dark:text-sky-400',
    dot:    'bg-sky-500',
  },
  '/workout': {
    idle:   'text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400',
    active: 'text-orange-600 dark:text-orange-400',
    dot:    'bg-orange-500',
  },
  '/nutrition': {
    idle:   'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400',
    active: 'text-emerald-600 dark:text-emerald-400',
    dot:    'bg-emerald-500',
  },
  '/library': {
    idle:   'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400',
    active: 'text-amber-600 dark:text-amber-400',
    dot:    'bg-amber-500',
  },
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-card/95 backdrop-blur-sm md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

        const accent = NAV_ACCENT[item.href] ?? NAV_ACCENT['/dashboard']

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
              isActive ? accent.active : accent.idle
            )}
          >
            <div className="relative">
              <Icon className="size-4.5" />
              {isActive && (
                <span className={cn('absolute -top-1 -right-1 size-1.5 rounded-full border border-card', accent.dot)} />
              )}
            </div>
            <span className={cn('font-medium', isActive && 'font-semibold')}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
