"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface RankingOption {
  name: string;
  voteCount: number;
}

interface RankedQuestion {
  id: string;
  prompt: string;
  totalVotes: number;
  options: RankingOption[];
  winner: RankingOption | null;
}

interface RankingListProps {
  questions: RankedQuestion[];
  basePath?: string;
}

export function RankingList({ questions, basePath = "" }: RankingListProps) {
  if (questions.length === 0) {
    return (
      <p className="text-center text-ink-muted py-8">No questions yet.</p>
    );
  }

  return (
    <div className="divide-y divide-ink/10 border border-ink/10 bg-white">
      {questions.map((q, index) => {
        const winner = q.winner ?? q.options[0];
        const winnerPct =
          q.totalVotes > 0
            ? Math.round(((winner?.voteCount ?? 0) / q.totalVotes) * 100)
            : 0;

        return (
          <Link
            key={q.id}
            href={basePath ? `${basePath}/${q.id}` : `/${q.id}`}
            className="flex items-center gap-4 px-4 py-4 hover:bg-cream-dark/50 transition-colors group"
          >
            {/* Rank number */}
            <span
              className={`font-mono text-lg font-bold w-8 text-center shrink-0 ${
                index === 0 ? "text-arena-red" : "text-ink-light"
              }`}
            >
              {index + 1}
            </span>

            {/* Question info */}
            <div className="flex-1 min-w-0">
              <p className="font-headline text-sm font-bold truncate group-hover:text-arena-red transition-colors">
                {q.prompt}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {winner && (
                  <span className="text-xs text-ink-muted font-ui truncate">
                    {winner.name}
                  </span>
                )}
                <div className="flex-1 max-w-24">
                  <ProgressBar
                    percentage={winnerPct}
                    isWinner={true}
                    animate={false}
                  />
                </div>
                <span className="text-xs font-mono text-ink-light shrink-0">
                  {winnerPct}%
                </span>
              </div>
            </div>

            {/* Vote count */}
            <span className="font-mono text-xs text-ink-light shrink-0">
              {q.totalVotes.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
