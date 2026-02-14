"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { VerdictStamp } from "@/components/vote/VerdictStamp";
import { ReactionBar } from "@/components/vote/ReactionBar";
import { MakeYourCase } from "@/components/vote/MakeYourCase";
import { YouVsTheCrowd } from "@/components/vote/YouVsTheCrowd";
import { ShareBar } from "@/components/vote/ShareBar";
import { Badge } from "@/components/ui/Badge";

interface FeaturedOption {
  name: string;
  voteCount: number;
  percentage: number;
  isWinner: boolean;
}

interface FeaturedData {
  id: string;
  prompt: string;
  subtitle: string | null;
  categoryName: string;
  categorySlug: string;
  totalVotes: number;
  winnerName: string | null;
  winnerPercentage: number;
  options: FeaturedOption[];
}

export default function DailyPage() {
  const [featured, setFeatured] = useState<FeaturedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((data) => setFeatured(data.featured))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Build VoteResult-shaped data for YouVsTheCrowd
  const voteResults = featured?.options.map((o, i) => ({
    optionId: `opt-${i}`,
    name: o.name,
    voteCount: o.voteCount,
    percentage: o.percentage,
    isWinner: o.isWinner,
    isUserVote: false,
  }));

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-cream-dark" />
            <div className="h-10 w-3/4 bg-cream-dark" />
            <div className="h-64 bg-cream-dark mt-6" />
          </div>
        ) : !featured ? (
          <div className="text-center py-16">
            <h2 className="mb-2">No Question of the Day</h2>
            <p className="text-ink-muted">Check back tomorrow!</p>
          </div>
        ) : (
          <>
            {/* Gold header */}
            <div className="text-center mb-8">
              <Badge variant="featured">Question of the Day</Badge>
              <p className="font-mono text-xs text-ink-light mt-2">{today}</p>
            </div>

            {/* Main card with gold border */}
            <div className="border-2 border-gold/40 bg-white shadow-card">
              {/* Header */}
              <div className="border-b border-gold/20 px-6 py-5 bg-gold/[0.03]">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="featured">Featured</Badge>
                  <Badge variant="category">{featured.categoryName}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl">{featured.prompt}</h1>
                {featured.subtitle && (
                  <p className="text-ink-muted text-sm mt-2">
                    {featured.subtitle}
                  </p>
                )}
              </div>

              {/* Results */}
              <div className="px-6 py-6">
                <div className="space-y-4">
                  {featured.options.map((opt, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span
                          className={`font-headline text-lg font-bold ${
                            opt.isWinner ? "text-arena-red" : ""
                          }`}
                        >
                          {opt.name}
                        </span>
                        <span className="text-score text-2xl">
                          {opt.percentage}%
                        </span>
                      </div>
                      <ProgressBar
                        percentage={opt.percentage}
                        isWinner={opt.isWinner}
                        animate={true}
                      />
                      <p className="text-xs text-ink-light font-mono mt-1">
                        {opt.voteCount.toLocaleString()} votes
                      </p>
                    </div>
                  ))}
                </div>

                {/* Verdict */}
                {featured.winnerName && (
                  <div className="mt-8 flex justify-center">
                    <VerdictStamp winnerName={featured.winnerName} />
                  </div>
                )}

                {/* Total */}
                <p className="text-center text-xs text-ink-light font-mono mt-4">
                  {featured.totalVotes.toLocaleString()} total votes
                </p>

                {/* You vs The Crowd */}
                {voteResults && (
                  <YouVsTheCrowd
                    questionId={featured.id}
                    results={voteResults}
                    totalVotes={featured.totalVotes}
                  />
                )}

                {/* Reactions */}
                <ReactionBar questionId={featured.id} />

                {/* Make Your Case */}
                <MakeYourCase questionId={featured.id} />

                {/* Vote CTA */}
                <div className="mt-6 text-center">
                  <Link
                    href={`/${featured.id}`}
                    className="inline-block font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-3 hover:bg-arena-red/90 transition-colors"
                  >
                    Cast Your Vote
                  </Link>
                </div>

                {/* Share */}
                {featured.winnerName && (
                  <ShareBar
                    questionId={featured.id}
                    prompt={featured.prompt}
                    winnerName={featured.winnerName}
                    winnerPercentage={featured.winnerPercentage}
                  />
                )}
              </div>
            </div>

            {/* Explore link */}
            <div className="mt-6 text-center">
              <Link
                href={`/explore/${featured.categorySlug}`}
                className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
              >
                More in {featured.categoryName} &rarr;
              </Link>
            </div>
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
