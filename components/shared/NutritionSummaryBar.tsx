import { cn } from '@/lib/utils'
import type { NutritionValues } from '@/types'
import { fmtNum } from '@/lib/nutrition'

interface NutritionSummaryBarProps extends NutritionValues {
  label?: string
  variant?: 'section' | 'total'
  className?: string
}

export function NutritionSummaryBar({
  calories,
  carbs_g,
  protein_g,
  fats_g,
  label,
  variant = 'section',
  className,
}: NutritionSummaryBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2 text-sm',
        variant === 'total'
          ? 'bg-primary/10 font-semibold text-primary'
          : 'bg-muted/60 text-muted-foreground',
        className
      )}
    >
      {label && <span className="font-medium text-foreground">{label}</span>}
      <span>
        <span className="font-semibold text-red-600 dark:text-red-400">{fmtNum(calories)}</span>
        <span className="ml-0.5 text-xs">kcal</span>
      </span>
      <span>
        <span className="font-semibold text-amber-600 dark:text-amber-400">{fmtNum(carbs_g)}</span>
        <span className="ml-0.5 text-xs">g carbs</span>
      </span>
      <span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">{fmtNum(protein_g)}</span>
        <span className="ml-0.5 text-xs">g protein</span>
      </span>
      <span>
        <span className="font-semibold text-orange-600 dark:text-orange-400">{fmtNum(fats_g)}</span>
        <span className="ml-0.5 text-xs">g fats</span>
      </span>
    </div>
  )
}
