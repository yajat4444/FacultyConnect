// Grey placeholder shapes shown while data loads, so layouts don't jump.
export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-wash ${className}`} />;
}

// A stack of list-row placeholders. `label` is read out by screen readers.
export function SkeletonList({ rows = 4, label = "Loading" }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border border-edge/60 bg-paper-raised p-5">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="mt-3 h-5 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
        </div>
      ))}
    </div>
  );
}

// Full-page placeholder for detail pages (profile, course, project).
export function SkeletonPage({ label = "Loading" }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-5xl px-6 py-16">
      <span className="sr-only">{label}…</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-10 w-2/3" />
      <Skeleton className="mt-4 h-4 w-1/2" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32 sm:col-span-2" />
      </div>
    </div>
  );
}
