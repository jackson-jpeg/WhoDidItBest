"use client";

type BadgeVariant = "category" | "featured" | "count";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  category:
    "text-smallcaps text-xs text-ink-muted border border-ink/15 px-2 py-0.5",
  featured:
    "font-ui uppercase text-xs font-bold tracking-wider text-gold border border-gold/40 px-2 py-0.5",
  count:
    "font-mono text-xs text-ink-muted bg-cream-dark px-2 py-0.5",
};

export function Badge({
  variant = "category",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span className={`inline-block ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
