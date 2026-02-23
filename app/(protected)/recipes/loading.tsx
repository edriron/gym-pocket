import { Skeleton } from '@/components/ui/skeleton'

export default function RecipesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
