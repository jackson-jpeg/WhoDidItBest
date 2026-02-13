"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-arena-red text-cream hover:bg-arena-red/90 active:bg-arena-red/80 border border-arena-red",
  secondary:
    "bg-ink text-cream hover:bg-ink/90 active:bg-ink/80 border border-ink",
  ghost:
    "bg-transparent text-ink hover:underline underline-offset-4 border border-transparent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className = "", children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`font-ui uppercase tracking-wide text-sm font-semibold px-6 py-3 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
