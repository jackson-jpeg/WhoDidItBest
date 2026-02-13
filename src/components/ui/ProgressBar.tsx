"use client";

import { motion } from "framer-motion";
import { barFillTransition } from "@/lib/animations";

interface ProgressBarProps {
  percentage: number;
  isWinner: boolean;
  animate?: boolean;
  className?: string;
}

export function ProgressBar({
  percentage,
  isWinner,
  animate = true,
  className = "",
}: ProgressBarProps) {
  return (
    <div
      className={`h-2 w-full bg-cream-dark overflow-hidden ${className}`}
    >
      <motion.div
        className={isWinner ? "bg-arena-red h-full" : "bg-bar-default h-full"}
        initial={animate ? { width: "0%" } : false}
        animate={{ width: `${percentage}%` }}
        transition={animate ? barFillTransition : { duration: 0 }}
      />
    </div>
  );
}
