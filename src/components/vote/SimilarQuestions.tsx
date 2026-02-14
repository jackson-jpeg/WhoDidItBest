"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SimilarQuestion {
  id: string;
  prompt: string;
  totalVotes: number;
  winnerName: string | null;
}

interface SimilarQuestionsProps {
  questionId: string;
}

export function SimilarQuestions({ questionId }: SimilarQuestionsProps) {
  const [questions, setQuestions] = useState<SimilarQuestion[]>([]);

  useEffect(() => {
    fetch(`/api/similar?questionId=${questionId}`)
      .then((r) => r.json())
      .then((data) => setQuestions(data.questions ?? []))
      .catch(() => {});
  }, [questionId]);

  if (questions.length === 0) return null;

  return (
    <div className="mt-6 border-t border-ink/10 pt-4">
      <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold mb-3">
        More Like This
      </p>
      <div className="space-y-2">
        {questions.map((q) => (
          <Link
            key={q.id}
            href={`/${q.id}`}
            className="flex items-center justify-between gap-3 px-3 py-2.5 border border-ink/10 hover:bg-ink/[0.02] transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="font-headline text-sm font-bold truncate group-hover:text-arena-red transition-colors">
                {q.prompt}
              </p>
              {q.winnerName && (
                <p className="font-ui text-[10px] text-ink-muted mt-0.5">
                  Leading: {q.winnerName}
                </p>
              )}
            </div>
            <span className="shrink-0 font-mono text-[10px] text-ink-light">
              {q.totalVotes} votes
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
