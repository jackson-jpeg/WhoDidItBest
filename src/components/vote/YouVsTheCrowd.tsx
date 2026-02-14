"use client";

import { useEffect, useState } from "react";
import type { VoteResult } from "@/lib/types";

interface YouVsTheCrowdProps {
  questionId: string;
  results: VoteResult[];
  totalVotes: number;
}

interface UserVoteData {
  optionId: string;
}

export function YouVsTheCrowd({
  questionId,
  results,
  totalVotes,
}: YouVsTheCrowdProps) {
  const [userVote, setUserVote] = useState<UserVoteData | null>(null);

  useEffect(() => {
    fetch(`/api/user-vote?questionId=${questionId}`)
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((data) => {
        if (data?.optionId) setUserVote(data);
      })
      .catch(() => {});
  }, [questionId]);

  if (!userVote || totalVotes === 0) return null;

  const votedResult = results.find((r) => r.optionId === userVote.optionId);
  if (!votedResult) return null;

  const winner = results.reduce((a, b) =>
    a.voteCount > b.voteCount ? a : b
  );
  const agreedWithMajority = votedResult.optionId === winner.optionId;
  const pct = votedResult.percentage;

  return (
    <div
      className={`mt-4 border px-4 py-3 text-center ${
        agreedWithMajority
          ? "border-arena-red/20 bg-arena-red/[0.03]"
          : "border-gold/30 bg-gold/[0.03]"
      }`}
    >
      <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold mb-1">
        You vs. The Crowd
      </p>
      {agreedWithMajority ? (
        <p className="text-sm">
          You picked{" "}
          <span className="font-headline font-bold text-arena-red">
            {votedResult.name}
          </span>{" "}
          — <span className="font-mono font-bold">{pct}%</span> of voters agree
          with you.
        </p>
      ) : (
        <p className="text-sm">
          You went against the crowd with{" "}
          <span className="font-headline font-bold">{votedResult.name}</span> —
          only <span className="font-mono font-bold">{pct}%</span> picked this.
        </p>
      )}
    </div>
  );
}
