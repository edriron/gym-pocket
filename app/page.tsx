import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Dumbbell } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo & branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Dumbbell className="size-8" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gym Pocket</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your workouts, diet, and weight — all in one place.
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">Sign in to continue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your Google account to get started
              </p>
            </div>
            <GoogleSignInButton />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to use this app responsibly.
        </p>
      </div>
    </div>
  )
}
