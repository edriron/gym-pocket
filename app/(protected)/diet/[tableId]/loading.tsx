import { Skeleton } from '@/components/ui/skeleton'

export default function DietTableLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-28" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  )
}
