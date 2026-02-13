"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";

interface VoteHistoryCardProps {
  questionId: string;
  prompt: string;
  categoryName: string;
  votedOptionName: string;
  winnerName: string;
  winnerPercentage: number;
  totalVotes: number;
  votedAt: string;
}

export function VoteHistoryCard({
  questionId,
  prompt,
  categoryName,
  votedOptionName,
  winnerName,
  winnerPercentage,
  totalVotes,
  votedAt,
}: VoteHistoryCardProps) {
  return (
    <Link
      href={`/${questionId}`}
      className="block border border-ink/10 bg-white px-5 py-4 hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="category">{categoryName}</Badge>
        <span className="font-mono text-xs text-ink-light">
          {timeAgo(votedAt)}
        </span>
      </div>

      <p className="font-headline text-base font-bold mb-2">{prompt}</p>

      <div className="flex items-center gap-2 mb-2">
        <span className="font-ui text-xs uppercase tracking-widest text-ink-muted">
          You voted:
        </span>
        <span className="font-ui text-xs uppercase tracking-widest text-ink font-semibold">
          {votedOptionName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-ui text-xs text-ink-muted truncate shrink-0">
          {winnerName}
        </span>
        <div className="flex-1 max-w-40">
          <ProgressBar
            percentage={winnerPercentage}
            isWinner={true}
            animate={false}
          />
        </div>
        <span className="font-mono text-xs text-ink-light shrink-0">
          {winnerPercentage}%
        </span>
        <span className="font-mono text-xs text-ink-light shrink-0">
          {totalVotes.toLocaleString()} votes
        </span>
      </div>
    </Link>
  );
}
