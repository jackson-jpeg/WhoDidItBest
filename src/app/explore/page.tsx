"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { CategoryCard } from "@/components/explore/CategoryCard";
import { RankingList } from "@/components/explore/RankingList";
import type { Category } from "@/lib/types";

interface TrendingQuestion {
  id: string;
  prompt: string;
  totalVotes: number;
  categoryName: string;
  options: { name: string; voteCount: number }[];
}

export default function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<TrendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/explore/categories").then((r) => r.json()),
      fetch("/api/explore/trending").then((r) => r.json()),
    ])
      .then(([catData, trendData]) => {
        setCategories(catData.categories ?? []);
        setTrending(trendData.questions ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-10">
          <h1 className="mb-2">Explore</h1>
          <p className="text-ink-muted">
            Browse categories, see trending matchups, and dive into the rankings.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-cream-dark" />
            <div className="h-32 bg-cream-dark" />
          </div>
        ) : (
          <>
            {/* Categories grid */}
            <section className="mb-12">
              <h2 className="text-lg mb-4 border-b border-ink/10 pb-2">
                Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </section>

            {/* Trending */}
            <section>
              <h2 className="text-lg mb-4 border-b border-ink/10 pb-2">
                Trending
              </h2>
              <RankingList
                questions={trending.map((q) => ({
                  id: q.id,
                  prompt: q.prompt,
                  totalVotes: q.totalVotes,
                  options: q.options.map((o) => ({
                    name: o.name,
                    voteCount: o.voteCount,
                  })),
                  winner: q.options.length > 0
                    ? q.options.reduce((a, b) =>
                        a.voteCount > b.voteCount ? a : b
                      )
                    : null,
                }))}
              />
            </section>
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
