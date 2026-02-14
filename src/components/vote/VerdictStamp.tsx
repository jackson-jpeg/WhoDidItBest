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
      <div className="border-3 border-arena-red px-6 py-3 shadow-stamp select-none relative">
        <span className="font-ui text-[10px] uppercase tracking-[0.3em] text-arena-red block text-center">
          The Verdict
        </span>
        <span className="font-headline text-2xl md:text-3xl font-black text-arena-red block leading-tight text-center mt-0.5">
          {winnerName}
        </span>
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-arena-red" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-arena-red" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-arena-red" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-arena-red" />
      </div>
    </motion.div>
  );
}
