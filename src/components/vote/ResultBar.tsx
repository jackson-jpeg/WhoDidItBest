"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { barFillTransition } from "@/lib/animations";
import type { VoteResult } from "@/lib/types";

interface ResultBarProps {
  result: VoteResult;
  animate?: boolean;
}

function CountUp({ target, animate: shouldAnimate }: { target: number; animate: boolean }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest));

  useEffect(() => {
    if (!shouldAnimate) {
      if (nodeRef.current) nodeRef.current.textContent = `${target}%`;
      return;
    }

    const controls = animate(motionVal, target, {
      duration: 0.8,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (v) => {
      if (nodeRef.current) nodeRef.current.textContent = `${v}%`;
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [target, shouldAnimate, motionVal, rounded]);

  return <span ref={nodeRef} className="text-score text-2xl">{shouldAnimate ? "0%" : `${target}%`}</span>;
}

export function ResultBar({
  result,
  animate: shouldAnimate = true,
}: ResultBarProps) {
  return (
    <motion.div
      className="py-3"
      initial={shouldAnimate ? { opacity: 0, x: -10 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={barFillTransition}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`font-headline text-lg font-bold ${result.isWinner ? "text-arena-red" : ""}`}>
            {result.name}
          </span>
          {result.isUserVote && (
            <span className="font-ui text-[10px] uppercase tracking-widest text-ink-muted border border-ink/20 px-1.5 py-0.5">
              Your Vote
            </span>
          )}
        </div>
        <CountUp target={result.percentage} animate={shouldAnimate} />
      </div>
      {result.subtitle && (
        <p className="text-xs text-ink-muted mb-1.5">{result.subtitle}</p>
      )}
      <ProgressBar
        percentage={result.percentage}
        isWinner={result.isWinner}
        animate={shouldAnimate}
      />
      <p className="text-xs text-ink-light font-mono mt-1">
        {result.voteCount.toLocaleString()} votes
      </p>
    </motion.div>
  );
}
