"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

interface Stats {
  totalVotes: number;
  favoriteCategory: string | null;
  agreementRate: number;
  questionsSkipped: number;
}

interface Streak {
  streak: number;
  votedToday: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: string;
}

interface RecapData {
  unlocked: boolean;
  totalVotes: number;
  agreementRate?: number;
  personality?: string;
  personalityEmoji?: string;
  personalityDesc?: string;
  topCategories?: { name: string; emoji: string | null; count: number }[];
  biggestUpset?: { prompt: string; percentage: number } | null;
}

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function ProfilePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/achievements").then((r) => r.json()),
      fetch("/api/recap").then((r) => r.json()),
    ])
      .then(([s, st, a, r]) => {
        setStats(s);
        setStreak(st);
        setAchievements(a.achievements ?? []);
        setRecap(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/2 bg-cream-dark" />
            <div className="h-32 bg-cream-dark" />
            <div className="h-48 bg-cream-dark" />
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {/* Header */}
            <motion.div variants={fadeIn} className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl mb-2">Your Arena</h1>
              <p className="text-ink-muted text-sm">
                Your votes, your streaks, your legacy.
              </p>
            </motion.div>

            {/* Personality card */}
            {recap?.unlocked && recap.personality && (
              <motion.div
                variants={fadeIn}
                className="border-2 border-gold/40 bg-white text-center px-6 py-8 mb-6"
              >
                <div className="text-5xl mb-3">{recap.personalityEmoji}</div>
                <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-1">
                  Your Voting Personality
                </p>
                <h2 className="text-2xl mb-2">{recap.personality}</h2>
                <p className="text-sm text-ink-muted max-w-sm mx-auto">
                  {recap.personalityDesc}
                </p>
              </motion.div>
            )}

            {/* Stats grid */}
            {stats && (
              <motion.div
                variants={fadeIn}
                className="border border-ink/10 bg-white mb-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-ink/10">
                  <div className="px-4 py-5 text-center">
                    <p className="font-mono text-3xl font-bold text-arena-red">
                      {stats.totalVotes}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      Votes Cast
                    </p>
                  </div>
                  <div className="px-4 py-5 text-center">
                    <p className="font-mono text-3xl font-bold">
                      {streak?.streak ?? 0}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      Day Streak {streak?.votedToday ? "🔥" : ""}
                    </p>
                  </div>
                  <div className="px-4 py-5 text-center">
                    <p className="font-mono text-3xl font-bold">
                      {stats.agreementRate}%
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      With Majority
                    </p>
                  </div>
                  <div className="px-4 py-5 text-center">
                    <p className="font-mono text-3xl font-bold text-ink-light">
                      {stats.questionsSkipped}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                      Skipped
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top categories */}
            {recap?.topCategories && recap.topCategories.length > 0 && (
              <motion.div
                variants={fadeIn}
                className="border border-ink/10 bg-white mb-6 px-5 py-4"
              >
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold mb-3">
                  Your Top Categories
                </p>
                <div className="space-y-2">
                  {recap.topCategories.map((cat, i) => {
                    const maxCount = recap.topCategories![0].count;
                    const pct = Math.round((cat.count / maxCount) * 100);
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
                              {cat.count} votes
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

            {/* Biggest upset */}
            {recap?.biggestUpset && (
              <motion.div
                variants={fadeIn}
                className="border border-gold/30 bg-gold/[0.03] mb-6 px-5 py-4"
              >
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-gold font-bold mb-1">
                  Your Hottest Take
                </p>
                <p className="text-sm">
                  &ldquo;{recap.biggestUpset.prompt}&rdquo; — you picked the
                  option only{" "}
                  <span className="font-mono font-bold">
                    {recap.biggestUpset.percentage}%
                  </span>{" "}
                  chose.
                </p>
              </motion.div>
            )}

            {/* Achievements */}
            <motion.div
              variants={fadeIn}
              className="border border-ink/10 bg-white mb-6 px-5 py-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold">
                  Achievements
                </p>
                <p className="font-mono text-xs text-ink-light">
                  {unlockedCount}/{achievements.length} unlocked
                </p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`text-center px-2 py-3 border transition-colors ${
                      a.unlocked
                        ? "border-gold/30 bg-gold/5"
                        : "border-ink/5 opacity-40"
                    }`}
                    title={a.description}
                  >
                    <div
                      className={`text-2xl ${a.unlocked ? "" : "grayscale"}`}
                    >
                      {a.emoji}
                    </div>
                    <p className="font-ui text-[9px] uppercase tracking-wide mt-1 truncate">
                      {a.name}
                    </p>
                    {a.progress && (
                      <p className="font-mono text-[9px] text-ink-light mt-0.5">
                        {a.progress}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick links */}
            <motion.div
              variants={fadeIn}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <Link
                href="/history"
                className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-arena-red transition-colors"
              >
                Vote History
              </Link>
              <Link
                href="/recap"
                className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-arena-red transition-colors"
              >
                Share Your Verdict
              </Link>
              <Link
                href="/"
                className="font-ui text-xs uppercase tracking-widest text-arena-red underline underline-offset-4"
              >
                Keep Voting
              </Link>
            </motion.div>

            {/* Empty state */}
            {stats && stats.totalVotes === 0 && (
              <motion.div
                variants={fadeIn}
                className="text-center py-12 border border-ink/10 bg-white mt-6"
              >
                <h3 className="mb-2">Your Arena Awaits</h3>
                <p className="text-ink-muted text-sm mb-6">
                  Start voting to unlock your stats, achievements, and
                  personality.
                </p>
                <Link
                  href="/"
                  className="font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-3 hover:bg-arena-red/90 transition-colors"
                >
                  Cast Your First Vote
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
