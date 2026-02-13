"use client";

export function VoteCardSkeleton() {
  return (
    <div className="border border-ink/10 bg-white shadow-card animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-ink/10 px-6 py-4">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-16 bg-cream-dark" />
          <div className="h-5 w-12 bg-cream-dark" />
        </div>
        <div className="h-7 w-3/4 bg-cream-dark" />
        <div className="h-4 w-1/2 bg-cream-dark mt-2" />
      </div>
      {/* Body skeleton */}
      <div className="px-6 py-6 space-y-3">
        <div className="border border-ink/5 p-6">
          <div className="h-6 w-2/3 bg-cream-dark" />
          <div className="h-4 w-1/3 bg-cream-dark mt-2" />
        </div>
        <div className="flex items-center justify-center py-2">
          <div className="h-7 w-8 bg-cream-dark" />
        </div>
        <div className="border border-ink/5 p-6">
          <div className="h-6 w-2/3 bg-cream-dark" />
          <div className="h-4 w-1/3 bg-cream-dark mt-2" />
        </div>
      </div>
    </div>
  );
}
