export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`} />
);

export const CardSkeleton = () => (
  <div className="card p-5">
    <Skeleton className="mb-3 h-5 w-2/3" />
    <Skeleton className="mb-2 h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4">
        {Array.from({ length: cols }).map((__, c) => (
          <Skeleton key={c} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);
