import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { WeightTable } from '@/components/weight/WeightTable'
import { WeightInsights } from '@/components/weight/WeightInsights'
import { AddWeightButton } from './WeightClientSection'
import { Scale, User } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { LandingPageCard } from '@/components/profile/LandingPageCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = { title: 'Weight & Profile — Gym Pocket' }

export default async function WeightPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: records }, statsRes, weightRes] = await Promise.all([
    supabase.from('weight_records').select('*').eq('user_id', user!.id).order('recorded_at', { ascending: false }),
    (supabase as any).from('user_body_stats').select('*').eq('user_id', user!.id).maybeSingle(),
    supabase.from('weight_records').select('weight_kg').eq('user_id', user!.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const sorted = records ?? []
  const stats = statsRes.data
  const latestWeightKg = weightRes.data?.weight_kg ? Number(weightRes.data.weight_kg) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight & Profile"
        description="Track your body weight and calculate your daily calorie needs."
        icon={Scale}
        iconColor="sky"
        action={<AddWeightButton />}
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-2">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="size-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="weight" className="gap-1.5">
            <Scale className="size-3.5" /> Weight
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm
            initialStats={stats ? {
              age: stats.age ?? undefined,
              height_cm: stats.height_cm ?? undefined,
              gender: (stats.gender as 'male' | 'female') ?? undefined,
              activity_level: (stats.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') ?? undefined,
            } : undefined}
            latestWeightKg={latestWeightKg}
          />
          <LandingPageCard initialLandingPage={(stats as { landing_page?: string } | null)?.landing_page ?? '/dashboard'} />
        </TabsContent>

        <TabsContent value="weight">
          {sorted.length === 0 ? (
            <EmptyState
              icon={Scale}
              iconColor="sky"
              title="No weight records yet"
              description="Start logging your weight to see your progress over time."
              action={<AddWeightButton />}
            />
          ) : (
            <div className="space-y-6">
              <WeightInsights records={sorted} />
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Records</h2>
                <WeightTable records={sorted} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
