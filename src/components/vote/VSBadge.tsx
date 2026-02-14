"use client";

export function VSBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center relative ${className}`}>
      <div className="flex-1 h-px bg-ink/10" />
      <div className="relative mx-3">
        <span className="font-headline text-arena-red text-3xl font-black tracking-tighter select-none relative z-10">
          VS
        </span>
        <span className="absolute inset-0 font-headline text-arena-red/10 text-3xl font-black tracking-tighter select-none blur-sm" aria-hidden>
          VS
        </span>
      </div>
      <div className="flex-1 h-px bg-ink/10" />
    </div>
  );
}
