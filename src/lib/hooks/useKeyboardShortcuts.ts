"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  onVote?: (optionIndex: number) => void;
  onSkip?: () => void;
  onNext?: () => void;
  optionCount: number;
  enabled: boolean;
}

export function useKeyboardShortcuts({
  onVote,
  onSkip,
  onNext,
  optionCount,
  enabled,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Number keys 1-4 for voting
      const num = parseInt(e.key);
      if (num >= 1 && num <= optionCount && onVote) {
        e.preventDefault();
        onVote(num - 1);
        return;
      }

      // S for skip
      if (e.key === "s" || e.key === "S") {
        if (onSkip) {
          e.preventDefault();
          onSkip();
        }
        return;
      }

      // N or Enter for next
      if (e.key === "n" || e.key === "N" || e.key === "Enter") {
        if (onNext) {
          e.preventDefault();
          onNext();
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onVote, onSkip, onNext, optionCount]);
}
