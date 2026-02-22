import type { User } from '@supabase/supabase-js'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

interface TopBarProps {
  user: User
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden" />
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
