import { cn } from '@/lib/utils'
import type { NutritionValues } from '@/types'
import { fmtNum } from '@/lib/nutrition'

interface NutritionBadgesProps extends Partial<NutritionValues> {
  size?: 'sm' | 'default'
  className?: string
}

const BADGES = [
  { key: 'calories' as keyof NutritionValues, label: 'kcal', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { key: 'carbs_g' as keyof NutritionValues, label: 'carbs', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'protein_g' as keyof NutritionValues, label: 'protein', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'fats_g' as keyof NutritionValues, label: 'fats', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
]

export function NutritionBadges({
  calories,
  carbs_g,
  protein_g,
  fats_g,
  size = 'default',
  className,
}: NutritionBadgesProps) {
  const values = { calories, carbs_g, protein_g, fats_g }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {BADGES.map(({ key, label, color }) => {
        const val = values[key]
        if (val === undefined || val === null) return null
        return (
          <span
            key={key}
            className={cn(
              'inline-flex items-center rounded-full px-2 font-medium',
              size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-xs',
              color
            )}
          >
            {fmtNum(val)}g {label === 'kcal' ? 'kcal' : label}
          </span>
        )
      })}
    </div>
  )
}
