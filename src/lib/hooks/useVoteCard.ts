"use client";

import { useState, useCallback } from "react";
import { useAchievementCheck } from "./useAchievementCheck";
import type { VoteCardState, VoteResults, VotePrompt } from "@/lib/types";

interface UseVoteCardReturn {
  state: VoteCardState;
  results: VoteResults | null;
  selectedOptionId: string | null;
  error: string | null;
  handleVote: (optionId: string) => Promise<void>;
  reset: () => void;
}

export function useVoteCard(question: VotePrompt): UseVoteCardReturn {
  const [state, setState] = useState<VoteCardState>("idle");
  const [results, setResults] = useState<VoteResults | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { checkAchievements } = useAchievementCheck();

  const handleVote = useCallback(
    async (optionId: string) => {
      if (state !== "idle") return;

      setState("voting");
      setSelectedOptionId(optionId);
      setError(null);

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            optionId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit vote");
        }

        const data: VoteResults = await res.json();
        setResults(data);
        setState("revealing");

        // Check for new achievement unlocks in the background
        checkAchievements();

        // After reveal animation completes, move to revealed
        setTimeout(() => {
          setState("revealed");
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setState("idle");
        setSelectedOptionId(null);
      }
    },
    [state, question.id, checkAchievements]
  );

  const reset = useCallback(() => {
    setState("idle");
    setResults(null);
    setSelectedOptionId(null);
    setError(null);
  }, []);

  return { state, results, selectedOptionId, error, handleVote, reset };
}
