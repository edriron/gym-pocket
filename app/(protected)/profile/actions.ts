'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BodyStatsFormValues } from '@/lib/validations'

export async function saveBodyStats(values: BodyStatsFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_body_stats')
    .upsert({
      user_id: user.id,
      age: values.age,
      height_cm: values.height_cm,
      gender: values.gender,
      activity_level: values.activity_level,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/profile')
}

export async function saveLandingPage(landingPage: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_body_stats')
    .upsert(
      { user_id: user.id, landing_page: landingPage, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return { error: (error as { message: string }).message }
  revalidatePath('/weight')
}
