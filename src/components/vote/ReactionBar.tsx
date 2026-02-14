"use client";

import { useEffect, useState } from "react";

const REACTIONS = [
  { key: "fire", emoji: "🔥", label: "Hot Take" },
  { key: "shocked", emoji: "😱", label: "Shocking" },
  { key: "fair", emoji: "🤝", label: "Fair" },
  { key: "wrong", emoji: "😤", label: "Wrong" },
] as const;

interface ReactionBarProps {
  questionId: string;
}

export function ReactionBar({ questionId }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?questionId=${questionId}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts ?? {});
        setUserReaction(data.userReaction ?? null);
      })
      .catch(() => {});
  }, [questionId]);

  const handleReaction = async (emoji: string) => {
    if (submitting) return;
    setSubmitting(true);

    // Optimistic update
    const wasSelected = userReaction === emoji;
    const prevCounts = { ...counts };
    const prevReaction = userReaction;

    if (wasSelected) {
      // Toggle off
      setUserReaction(null);
      setCounts((prev) => ({
        ...prev,
        [emoji]: Math.max((prev[emoji] ?? 1) - 1, 0),
      }));
    } else {
      // Toggle on (remove old if exists)
      if (userReaction) {
        setCounts((prev) => ({
          ...prev,
          [userReaction]: Math.max((prev[userReaction] ?? 1) - 1, 0),
        }));
      }
      setUserReaction(emoji);
      setCounts((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] ?? 0) + 1,
      }));
    }

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, emoji }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setCounts(prevCounts);
      setUserReaction(prevReaction);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {REACTIONS.map((r) => {
        const count = counts[r.key] ?? 0;
        const isActive = userReaction === r.key;
        return (
          <button
            key={r.key}
            onClick={() => handleReaction(r.key)}
            title={r.label}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm border transition-colors cursor-pointer ${
              isActive
                ? "border-arena-red/30 bg-arena-red/5"
                : "border-ink/10 hover:border-ink/20"
            }`}
          >
            <span>{r.emoji}</span>
            {count > 0 && (
              <span className="font-mono text-[10px] text-ink-muted">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
