import { Skeleton } from '@/components/ui/skeleton'

export default function LogLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-6 w-32 mx-2" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
