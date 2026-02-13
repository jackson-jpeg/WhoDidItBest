"use client";

export function VSBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="hidden md:block flex-1 h-px bg-ink/10" />
      <span className="font-headline text-arena-red text-2xl font-black tracking-tight px-4 select-none">
        VS
      </span>
      <div className="hidden md:block flex-1 h-px bg-ink/10" />
      <div className="md:hidden w-full h-px bg-ink/10 absolute left-0" />
    </div>
  );
}
