'use client'

import { useState } from 'react'
import { Loader2, Home } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saveLandingPage } from '@/app/(protected)/profile/actions'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface LandingPageCardProps {
  initialLandingPage?: string
}

export function LandingPageCard({ initialLandingPage = '/dashboard' }: LandingPageCardProps) {
  const [selected, setSelected] = useState(initialLandingPage)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const res = await saveLandingPage(selected)
      if (res?.error) toast.error(res.error)
      else toast.success('Landing page saved')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Home className="size-4 text-muted-foreground" /> Default Landing Page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose which page opens when you sign in or tap the app icon.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = selected === item.href
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => setSelected(item.href)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left',
                  isActive
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </div>
        <Button onClick={handleSave} disabled={loading} size="sm">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </CardContent>
    </Card>
  )
}
