"use client";

import { useEffect, useState, useCallback } from "react";
import { VoteCard } from "@/components/vote/VoteCard";
import { VoteCardSkeleton } from "@/components/vote/VoteCardSkeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import type { VotePrompt } from "@/lib/types";

export default function VoteFeedPage() {
  const [questions, setQuestions] = useState<VotePrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed");
      if (!res.ok) throw new Error("Failed to load feed");
      const data = await res.json();
      return data.questions as VotePrompt[];
    } catch (err) {
      throw err;
    }
  }, []);

  const loadInitialFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const batch = await fetchFeed();
      setQuestions(batch);
      setCurrentIndex(0);
    } catch {
      setError("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchFeed]);

  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  // Prefetch next batch when nearing the end
  useEffect(() => {
    if (currentIndex >= questions.length - 3 && questions.length > 0) {
      fetchFeed().then((newBatch) => {
        if (newBatch.length > 0) {
          setQuestions((prev) => [...prev, ...newBatch]);
        }
      });
    }
  }, [currentIndex, questions.length, fetchFeed]);

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;
    // Fire skip API in background — don't block the UI
    fetch("/api/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: currentQuestion.id }),
    }).catch(() => {}); // silent fail is fine for skip tracking
    setCurrentIndex((prev) => prev + 1);
  };

  const currentQuestion = questions[currentIndex];

  return (
    <>
      <Navbar />
      <PageContainer>
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2">Cast Your Vote</h1>
          <p className="text-ink-muted font-ui text-sm uppercase tracking-widest">
            Tap to choose. See the verdict.
          </p>
        </div>

        {/* Vote card */}
        {loading ? (
          <VoteCardSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-ink-muted mb-4">{error}</p>
            <button
              onClick={loadInitialFeed}
              className="font-ui text-sm uppercase tracking-wide text-arena-red underline underline-offset-4 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : currentQuestion ? (
          <VoteCard
            key={currentQuestion.id}
            question={currentQuestion}
            onNextQuestion={handleNext}
            onSkip={handleSkip}
          />
        ) : (
          <div className="text-center py-16 border border-ink/10 bg-white">
            <h3 className="mb-2">All Caught Up</h3>
            <p className="text-ink-muted text-sm">
              You&apos;ve voted on every question. Check back later for new matchups.
            </p>
          </div>
        )}

        {/* Progress indicator */}
        {!loading && questions.length > 0 && (
          <p className="text-center text-xs text-ink-light font-mono mt-4">
            {currentIndex + 1} / {questions.length}
          </p>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
