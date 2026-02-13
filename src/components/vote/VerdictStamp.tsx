"use client";

import { motion } from "framer-motion";
import { stampVariants } from "@/lib/animations";

interface VerdictStampProps {
  winnerName: string;
  className?: string;
}

export function VerdictStamp({ winnerName, className = "" }: VerdictStampProps) {
  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={stampVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="border-2 border-arena-red px-4 py-2 shadow-stamp select-none">
        <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-arena-red block">
          Verdict
        </span>
        <span className="font-headline text-lg font-black text-arena-red block leading-tight">
          {winnerName}
        </span>
      </div>
    </motion.div>
  );
}
