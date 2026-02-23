import { Skeleton } from '@/components/ui/skeleton'

export default function WorkoutTableLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="space-y-2 rounded-xl border p-4">
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
