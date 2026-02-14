"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface PulseData {
  totalVotes: number;
  totalQuestions: number;
  totalArguments: number;
  votesToday: number;
  hottestQuestion: {
    id: string;
    prompt: string;
    categoryName: string;
    totalVotes: number;
    recentVotes: number;
  } | null;
  mostControversial: {
    id: string;
    prompt: string;
    categoryName: string;
    totalVotes: number;
    splitPercentage: number;
  } | null;
  biggestBlowout: {
    id: string;
    prompt: string;
    categoryName: string;
    totalVotes: number;
    winnerName: string;
    winnerPercentage: number;
  } | null;
  categoryStats: { name: string; emoji: string | null; votes: number }[];
}

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pulse")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxCatVotes = data?.categoryStats?.[0]?.votes ?? 1;

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/3 bg-cream-dark" />
            <div className="h-32 bg-cream-dark" />
            <div className="h-48 bg-cream-dark" />
          </div>
        ) : data ? (
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {/* Header */}
            <motion.div variants={fadeIn} className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl mb-2">The Pulse</h1>
              <p className="text-ink-muted text-sm">
                Live stats from the arena. Updated in real time.
              </p>
            </motion.div>

            {/* Platform stats */}
            <motion.div
              variants={fadeIn}
              className="border border-ink/10 bg-white mb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-ink/10">
                <div className="px-4 py-5 text-center">
                  <p className="font-mono text-3xl font-bold text-arena-red">
                    {data.totalVotes.toLocaleString()}
                  </p>
                  <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                    Total Votes
                  </p>
                </div>
                <div className="px-4 py-5 text-center">
                  <p className="font-mono text-3xl font-bold">
                    {data.votesToday.toLocaleString()}
                  </p>
                  <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                    Votes Today
                  </p>
                </div>
                <div className="px-4 py-5 text-center">
                  <p className="font-mono text-3xl font-bold">
                    {data.totalQuestions.toLocaleString()}
                  </p>
                  <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                    Questions
                  </p>
                </div>
                <div className="px-4 py-5 text-center">
                  <p className="font-mono text-3xl font-bold">
                    {data.totalArguments.toLocaleString()}
                  </p>
                  <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                    Arguments
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Hottest question */}
            {data.hottestQuestion && (
              <motion.div variants={fadeIn}>
                <Link
                  href={`/explore/question/${data.hottestQuestion.id}`}
                  className="block border-2 border-arena-red/30 bg-white mb-4 px-5 py-4 hover:shadow-card-hover transition-shadow group"
                >
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-arena-red font-bold mb-1">
                    Hottest Right Now
                  </p>
                  <p className="font-headline text-base font-bold group-hover:text-arena-red transition-colors">
                    {data.hottestQuestion.prompt}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-ui text-xs text-ink-muted">
                      {data.hottestQuestion.categoryName}
                    </span>
                    <span className="font-mono text-xs text-arena-red">
                      +{data.hottestQuestion.recentVotes} today
                    </span>
                    <span className="font-mono text-xs text-ink-light">
                      {data.hottestQuestion.totalVotes.toLocaleString()} total
                    </span>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Two-column: Controversial + Blowout */}
            <motion.div
              variants={fadeIn}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              {data.mostControversial && (
                <Link
                  href={`/explore/question/${data.mostControversial.id}`}
                  className="block border border-gold/30 bg-white px-5 py-4 hover:shadow-card-hover transition-shadow group"
                >
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-gold font-bold mb-1">
                    Most Controversial
                  </p>
                  <p className="font-headline text-sm font-bold group-hover:text-arena-red transition-colors line-clamp-2">
                    {data.mostControversial.prompt}
                  </p>
                  <p className="font-mono text-xs text-ink-muted mt-2">
                    {data.mostControversial.splitPercentage}/
                    {100 - data.mostControversial.splitPercentage} split &middot;{" "}
                    {data.mostControversial.totalVotes} votes
                  </p>
                </Link>
              )}

              {data.biggestBlowout && (
                <Link
                  href={`/explore/question/${data.biggestBlowout.id}`}
                  className="block border border-ink/10 bg-white px-5 py-4 hover:shadow-card-hover transition-shadow group"
                >
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold mb-1">
                    Biggest Blowout
                  </p>
                  <p className="font-headline text-sm font-bold group-hover:text-arena-red transition-colors line-clamp-2">
                    {data.biggestBlowout.prompt}
                  </p>
                  <p className="font-mono text-xs text-ink-muted mt-2">
                    <span className="text-arena-red font-bold">
                      {data.biggestBlowout.winnerName}
                    </span>{" "}
                    at {data.biggestBlowout.winnerPercentage}% &middot;{" "}
                    {data.biggestBlowout.totalVotes} votes
                  </p>
                </Link>
              )}
            </motion.div>

            {/* Category breakdown */}
            {data.categoryStats.length > 0 && (
              <motion.div
                variants={fadeIn}
                className="border border-ink/10 bg-white px-5 py-4 mb-6"
              >
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold mb-3">
                  Votes by Category (This Week)
                </p>
                <div className="space-y-2">
                  {data.categoryStats.map((cat, i) => {
                    const pct = Math.round((cat.votes / maxCatVotes) * 100);
                    return (
                      <div key={cat.name} className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center shrink-0">
                          {cat.emoji ?? "📁"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span
                              className={`font-headline text-sm font-bold ${
                                i === 0 ? "text-arena-red" : ""
                              }`}
                            >
                              {cat.name}
                            </span>
                            <span className="font-mono text-xs text-ink-light">
                              {cat.votes.toLocaleString()}
                            </span>
                          </div>
                          <ProgressBar
                            percentage={pct}
                            isWinner={i === 0}
                            animate={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div variants={fadeIn} className="text-center">
              <Link
                href="/"
                className="inline-block font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-3 hover:bg-arena-red/90 transition-colors"
              >
                Jump Into the Arena
              </Link>
            </motion.div>
          </motion.div>
        ) : null}
      </PageContainer>
      <Footer />
    </>
  );
}
