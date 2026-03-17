import { cn } from '@/lib/utils'
import type { NutritionValues } from '@/types'
import { fmtNum } from '@/lib/nutrition'
import { Flame, Wheat, Beef, Droplets } from 'lucide-react'

interface NutritionSummaryBarProps extends NutritionValues {
  label?: string
  variant?: 'section' | 'total'
  className?: string
}

const MACROS = [
  {
    key: 'calories' as const,
    icon: Flame,
    unit: 'kcal',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
  },
  {
    key: 'carbs_g' as const,
    icon: Wheat,
    unit: 'g carbs',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    key: 'protein_g' as const,
    icon: Beef,
    unit: 'g protein',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  {
    key: 'fats_g' as const,
    icon: Droplets,
    unit: 'g fats',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
  },
]

export function NutritionSummaryBar({
  calories,
  carbs_g,
  protein_g,
  fats_g,
  label,
  variant = 'section',
  className,
}: NutritionSummaryBarProps) {
  const values = { calories, carbs_g, protein_g, fats_g }
  const isTotal = variant === 'total'

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-4 py-2.5 text-sm',
        isTotal
          ? 'bg-primary/8 border border-primary/15'
          : 'bg-muted/50',
        className
      )}
    >
      {label && (
        <span className={cn('font-semibold text-xs uppercase tracking-wide mr-1', isTotal ? 'text-primary' : 'text-muted-foreground')}>
          {label}
        </span>
      )}
      {MACROS.map(({ key, icon: Icon, unit, color, bg }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={cn('flex size-5 items-center justify-center rounded-md shrink-0', bg)}>
            <Icon className={cn('size-3', color)} />
          </span>
          <span>
            <span className={cn('font-semibold tabular-nums', color)}>{fmtNum(values[key])}</span>
            <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
