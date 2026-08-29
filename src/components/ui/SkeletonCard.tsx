export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
      <div className="skeleton-shimmer h-52 w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton-shimmer h-5 w-3/4 rounded-lg" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded-lg" />
        <div className="skeleton-shimmer h-4 w-2/3 rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton-shimmer h-6 w-20 rounded-full" />
          <div className="skeleton-shimmer h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
