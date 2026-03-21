'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Flame, Activity, Ruler, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { saveBodyStats } from '@/app/(protected)/profile/actions'
import { bodyStatsSchema, type BodyStatsFormValues } from '@/lib/validations'
import { cn } from '@/lib/utils'

interface ProfileFormProps {
  initialStats?: Partial<BodyStatsFormValues>
  latestWeightKg: number | null
}

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise, desk job', multiplier: 1.2 },
  { value: 'light', label: 'Lightly Active', description: 'Light exercise 1–3 days/week', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3–5 days/week', multiplier: 1.55 },
  { value: 'active', label: 'Very Active', description: 'Hard exercise 6–7 days/week', multiplier: 1.725 },
  { value: 'very_active', label: 'Extra Active', description: 'Very hard exercise + physical job', multiplier: 1.9 },
] as const

function calcBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female') {
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export function ProfileForm({ initialStats, latestWeightKg }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<BodyStatsFormValues>({
    resolver: zodResolver(bodyStatsSchema),
    defaultValues: {
      age: initialStats?.age ?? ('' as unknown as number),
      height_cm: initialStats?.height_cm ?? ('' as unknown as number),
      gender: initialStats?.gender,
      activity_level: initialStats?.activity_level,
    },
  })

  const values = form.watch()
  const { age, height_cm, gender, activity_level } = values

  // Live calculation
  const canCalc = latestWeightKg && age > 0 && height_cm > 0 && gender && activity_level
  const bmr = canCalc ? Math.round(calcBMR(latestWeightKg!, height_cm, age, gender)) : null
  const activityOpt = ACTIVITY_OPTIONS.find(o => o.value === activity_level)
  const tdee = bmr && activityOpt ? Math.round(bmr * activityOpt.multiplier) : null

  // BMI
  const heightM = height_cm ? height_cm / 100 : null
  const bmi = latestWeightKg && heightM ? Math.round((latestWeightKg / (heightM * heightM)) * 10) / 10 : null
  const bmiCategory = bmi === null ? null
    : bmi < 18.5 ? { label: 'Underweight', color: 'text-blue-600 dark:text-blue-400' }
    : bmi < 25 ? { label: 'Normal weight', color: 'text-emerald-600 dark:text-emerald-400' }
    : bmi < 30 ? { label: 'Overweight', color: 'text-amber-600 dark:text-amber-400' }
    : { label: 'Obese', color: 'text-red-600 dark:text-red-400' }

  async function handleSubmit(values: BodyStatsFormValues) {
    setLoading(true)
    try {
      const res = await saveBodyStats(values)
      if (res?.error) toast.error(res.error)
      else toast.success('Profile saved')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Body Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              {/* Age & Height */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" /> Age
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 25"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Ruler className="size-3.5 text-muted-foreground" /> Height (cm)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 175"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" /> Gender
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {(['male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => field.onChange(g)}
                          className={cn(
                            'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all capitalize',
                            field.value === g
                              ? 'border-primary bg-primary/8 text-primary'
                              : 'border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground'
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Activity level */}
              <FormField
                control={form.control}
                name="activity_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Activity className="size-3.5 text-muted-foreground" /> Activity Level
                    </FormLabel>
                    <div className="space-y-2">
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            'w-full rounded-lg border px-4 py-3 text-left transition-all',
                            field.value === opt.value
                              ? 'border-primary bg-primary/8'
                              : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                          )}
                        >
                          <div className={cn('text-sm font-medium', field.value === opt.value ? 'text-primary' : 'text-foreground')}>
                            {opt.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="size-4 animate-spin" />}
                Save Stats
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results panel */}
      <div className="space-y-4">
        {!latestWeightKg && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Add a weight record in the <strong>Weight</strong> tab to unlock BMR and TDEE calculations.
              </p>
            </CardContent>
          </Card>
        )}

        {latestWeightKg && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums">{latestWeightKg}</span>
                <span className="text-muted-foreground">kg</span>
              </div>
              {bmi !== null && (
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">BMI: </span>
                  <span className={cn('text-sm font-semibold', bmiCategory?.color)}>{bmi} — {bmiCategory?.label}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {bmr !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="size-4 text-red-500" /> BMR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-red-600 dark:text-red-400">{bmr}</span>
                <span className="text-muted-foreground text-sm">kcal / day</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Basal Metabolic Rate — calories your body burns at complete rest (Mifflin-St Jeor formula).
              </p>
            </CardContent>
          </Card>
        )}

        {tdee !== null && activityOpt && (
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="size-4 text-emerald-600 dark:text-emerald-400" /> Daily Calorie Need
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{tdee}</span>
                <span className="text-muted-foreground text-sm">kcal / day</span>
              </div>
              <p className="text-xs text-muted-foreground">
                TDEE — total daily energy expenditure at your <strong>{activityOpt.label}</strong> activity level (BMR × {activityOpt.multiplier}).
              </p>
              <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                <p>To lose weight: eat ~{tdee - 500} kcal/day (−500 deficit)</p>
                <p>To gain muscle: eat ~{tdee + 300} kcal/day (+300 surplus)</p>
                <p>To maintain: eat ~{tdee} kcal/day</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!canCalc && latestWeightKg && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Fill in your age, height, gender, and activity level to see your daily calorie needs.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
