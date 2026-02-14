"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";

interface RecapData {
  unlocked: boolean;
  totalVotes: number;
  minRequired?: number;
  agreementRate?: number;
  personality?: string;
  personalityEmoji?: string;
  personalityDesc?: string;
  topCategories?: { name: string; emoji: string | null; count: number }[];
  biggestUpset?: { prompt: string; percentage: number } | null;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function RecapPage() {
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/recap")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    if (!data?.unlocked) return;
    const text = `My Who Did It Best? personality: ${data.personalityEmoji} ${data.personality}\n\n${data.totalVotes} votes cast · ${data.agreementRate}% agreement rate\n\nWhat's yours?`;
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Voting Personality", text, url });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <div className="animate-pulse space-y-6 py-8">
            <div className="h-16 w-16 bg-cream-dark mx-auto" />
            <div className="h-10 w-2/3 bg-cream-dark mx-auto" />
            <div className="h-6 w-1/2 bg-cream-dark mx-auto" />
          </div>
        ) : data && !data.unlocked ? (
          <div className="text-center py-16 border border-ink/10 bg-white px-6">
            <div className="text-5xl mb-4">&#128274;</div>
            <h1 className="mb-2">Your Verdict</h1>
            <p className="text-ink-muted text-sm mb-2">
              Vote on at least {data.minRequired} questions to unlock your
              voting personality.
            </p>
            <p className="font-mono text-lg text-arena-red mb-6">
              {data.totalVotes} / {data.minRequired}
            </p>
            <Link
              href="/"
              className="font-ui text-xs uppercase tracking-widest text-arena-red underline underline-offset-4"
            >
              Start Voting
            </Link>
          </div>
        ) : data?.unlocked ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Personality card */}
            <motion.div
              variants={fadeUp}
              className="border border-ink/10 bg-white text-center px-8 py-10 mb-6"
            >
              <div className="text-6xl mb-4">{data.personalityEmoji}</div>
              <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">
                Your voting personality
              </p>
              <h1 className="text-3xl md:text-4xl mb-3">{data.personality}</h1>
              <p className="text-ink-muted max-w-md mx-auto">
                {data.personalityDesc}
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-2 gap-3 mb-6"
            >
              <div className="border border-ink/10 bg-white px-5 py-5 text-center">
                <p className="font-mono text-3xl font-bold text-arena-red">
                  {data.totalVotes}
                </p>
                <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                  Votes Cast
                </p>
              </div>
              <div className="border border-ink/10 bg-white px-5 py-5 text-center">
                <p className="font-mono text-3xl font-bold">
                  {data.agreementRate}%
                </p>
                <p className="font-ui text-[10px] uppercase tracking-widest text-ink-muted mt-1">
                  With the Crowd
                </p>
              </div>
            </motion.div>

            {/* Top categories */}
            {data.topCategories && data.topCategories.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="border border-ink/10 bg-white mb-6"
              >
                <div className="px-5 py-3 border-b border-ink/10">
                  <p className="font-ui text-xs uppercase tracking-widest text-ink-muted">
                    Your Top Categories
                  </p>
                </div>
                <div className="divide-y divide-ink/10">
                  {data.topCategories.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-lg font-bold w-6 text-center ${
                            i === 0 ? "text-arena-red" : "text-ink-light"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="font-headline font-bold">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-ink-light">
                        {cat.count} votes
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Biggest upset */}
            {data.biggestUpset && (
              <motion.div
                variants={fadeUp}
                className="border border-arena-red/20 bg-arena-red/5 px-5 py-4 mb-6"
              >
                <p className="font-ui text-[10px] uppercase tracking-widest text-arena-red mb-1">
                  Your Hottest Take
                </p>
                <p className="font-headline font-bold text-sm">
                  {data.biggestUpset.prompt}
                </p>
                <p className="text-ink-muted text-xs mt-1">
                  You picked the option only {data.biggestUpset.percentage}% of
                  people chose
                </p>
              </motion.div>
            )}

            {/* Share button */}
            <motion.div variants={fadeUp} className="text-center">
              <button
                onClick={handleShare}
                className="font-ui uppercase tracking-wide text-sm font-semibold px-8 py-3 bg-arena-red text-cream hover:bg-arena-red/90 border border-arena-red transition-colors cursor-pointer"
              >
                {copied ? "Copied to clipboard!" : "Share Your Verdict"}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </PageContainer>
      <Footer />
    </>
  );
}
