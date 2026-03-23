import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { WeightTable } from '@/components/weight/WeightTable'
import { WeightChart } from '@/components/weight/WeightChart'
import { AddWeightButton } from './WeightClientSection'
import { Scale, User } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = { title: 'Weight & Profile — Gym Pocket' }

export default async function WeightPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: records }, statsRes, weightRes] = await Promise.all([
    supabase.from('weight_records').select('*').eq('user_id', user!.id).order('recorded_at', { ascending: false }),
    supabase.from('user_body_stats').select('*').eq('user_id', user!.id).maybeSingle(),
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

        <TabsContent value="profile">
          <ProfileForm
            initialStats={stats ? {
              age: stats.age ?? undefined,
              height_cm: stats.height_cm ?? undefined,
              gender: (stats.gender as 'male' | 'female') ?? undefined,
              activity_level: (stats.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') ?? undefined,
            } : undefined}
            latestWeightKg={latestWeightKg}
          />
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
              <div className="rounded-xl border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Weight Trend</h2>
                <WeightChart records={sorted} />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Records</h2>
                <WeightTable records={sorted} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
