"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VoteCard } from "@/components/vote/VoteCard";
import { VoteCardSkeleton } from "@/components/vote/VoteCardSkeleton";
import { FeaturedBanner } from "@/components/vote/FeaturedBanner";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import Link from "next/link";
import { WelcomeOverlay } from "@/components/shared/WelcomeOverlay";
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
      <WelcomeOverlay />
      <Navbar />
      <PageContainer>
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2">Cast Your Vote</h1>
          <p className="text-ink-muted font-ui text-sm uppercase tracking-widest">
            Tap to choose. See the verdict.
          </p>
        </div>

        {/* Question of the Day */}
        {!loading && !error && <FeaturedBanner />}

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
        ) : (
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <VoteCard
                key={currentQuestion.id}
                question={currentQuestion}
                onNextQuestion={handleNext}
                onSkip={handleSkip}
              />
            ) : (
              <motion.div
                key="caught-up"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
                className="text-center border-2 border-arena-red/20 bg-white px-6 py-12"
              >
                <div className="border-3 border-arena-red/30 inline-block px-6 py-3 mb-6 -rotate-3">
                  <span className="font-ui text-[10px] uppercase tracking-[0.3em] text-arena-red block">
                    Card Cleared
                  </span>
                  <span className="font-headline text-2xl font-black text-arena-red">
                    Champion
                  </span>
                </div>
                <p className="text-ink-muted text-sm mb-1">
                  {currentIndex} matchup{currentIndex !== 1 ? "s" : ""} decided. The arena is empty&mdash;for now.
                </p>
                <p className="text-ink-muted text-sm mb-8">
                  New matchups are added daily. Come back tomorrow to keep your streak alive.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/explore"
                    className="font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-2.5 hover:bg-arena-red/90 transition-colors"
                  >
                    Browse All Questions
                  </Link>
                  <Link
                    href="/submit"
                    className="font-ui text-sm uppercase tracking-wide border border-ink/15 text-ink px-6 py-2.5 hover:bg-ink/[0.03] transition-colors"
                  >
                    Submit a Question
                  </Link>
                </div>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Link
                    href="/leaderboard"
                    className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-arena-red transition-colors underline underline-offset-4"
                  >
                    Rankings
                  </Link>
                  <Link
                    href="/pulse"
                    className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-arena-red transition-colors underline underline-offset-4"
                  >
                    The Pulse
                  </Link>
                  <Link
                    href="/profile"
                    className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-arena-red transition-colors underline underline-offset-4"
                  >
                    Your Profile
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </PageContainer>
      <Footer />
    </>
  );
}
