import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { User } from 'lucide-react'
import { ProfileForm } from '@/components/profile/ProfileForm'

export const metadata = { title: 'Profile — Gym Pocket' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [statsRes, weightRes] = await Promise.all([
    supabase.from('user_body_stats').select('*').eq('user_id', user!.id).maybeSingle(),
    supabase.from('weight_records').select('weight_kg').eq('user_id', user!.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const stats = statsRes.data
  const latestWeightKg = weightRes.data?.weight_kg ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your body stats and daily calorie needs."
        icon={User}
        iconColor="violet"
      />
      <ProfileForm
        initialStats={stats ? {
          age: stats.age ?? undefined,
          height_cm: stats.height_cm ?? undefined,
          gender: (stats.gender as 'male' | 'female') ?? undefined,
          activity_level: (stats.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') ?? undefined,
        } : undefined}
        latestWeightKg={latestWeightKg ? Number(latestWeightKg) : null}
      />
    </div>
  )
}
