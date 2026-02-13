"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { VoteHistoryCard } from "@/components/history/VoteHistoryCard";
import { Button } from "@/components/ui/Button";

interface HistoryVote {
  questionId: string;
  prompt: string;
  categoryName: string;
  votedOptionName: string;
  winnerName: string;
  winnerPercentage: number;
  totalVotes: number;
  votedAt: string;
}

interface Stats {
  totalVotes: number;
  favoriteCategory: string | null;
  agreementRate: number;
  questionsSkipped: number;
}

export default function HistoryPage() {
  const [votes, setVotes] = useState<HistoryVote[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/history?cursor=${encodeURIComponent(cursor)}`
      : "/api/history";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load history");
    return res.json();
  }, []);

  useEffect(() => {
    Promise.all([
      fetchHistory(),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([historyData, statsData]) => {
        setVotes(historyData.votes);
        setNextCursor(historyData.nextCursor);
        setStats(statsData);
      })
      .finally(() => setLoading(false));
  }, [fetchHistory]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchHistory(nextCursor);
      setVotes((prev) => [...prev, ...data.votes]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-8">
          <h1 className="mb-2">Your Votes</h1>
          <p className="text-ink-muted">
            Everything you&apos;ve voted on, all in one place.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-cream-dark" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-cream-dark" />
            ))}
          </div>
        ) : votes.length === 0 ? (
          <div className="text-center py-16 border border-ink/10 bg-white">
            <h3 className="mb-2">No votes yet</h3>
            <p className="text-ink-muted text-sm mb-6">
              Start voting to build your history!
            </p>
            <Link
              href="/"
              className="font-ui text-xs uppercase tracking-widest text-arena-red underline underline-offset-4"
            >
              Start Voting
            </Link>
          </div>
        ) : (
          <>
            {/* Stats banner */}
            {stats && stats.totalVotes > 0 && (
              <div className="border border-ink/10 bg-white mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink/10">
                  <div className="px-4 py-4 text-center">
                    <p className="font-mono text-2xl font-bold text-arena-red">
                      {stats.totalVotes}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      Votes Cast
                    </p>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <p className="font-mono text-2xl font-bold">
                      {stats.agreementRate}%
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      With Majority
                    </p>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <p className="font-headline text-lg font-bold truncate px-1">
                      {stats.favoriteCategory ?? "—"}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      Top Category
                    </p>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <p className="font-mono text-2xl font-bold text-ink-light">
                      {stats.questionsSkipped}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      Skipped
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {votes.map((vote) => (
                <VoteHistoryCard key={vote.questionId} {...vote} />
              ))}
            </div>

            {nextCursor && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-ink-light font-mono mt-4">
              {votes.length} vote{votes.length !== 1 ? "s" : ""} shown
            </p>
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
