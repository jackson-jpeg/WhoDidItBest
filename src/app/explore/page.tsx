"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

interface SearchResult {
  id: string;
  prompt: string;
  totalVotes: number;
  categoryName: string;
  options: { name: string; voteCount: number }[];
  winner: { name: string; voteCount: number } | null;
}

export default function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<TrendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/explore/search?q=${encodeURIComponent(query.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.questions ?? []);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const isSearching = searchQuery.trim().length > 0;

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

        {/* Search bar */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search questions..."
            className="w-full border border-ink/15 bg-white px-4 py-3 font-ui text-sm text-ink placeholder:text-ink-light focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-cream-dark" />
            <div className="h-32 bg-cream-dark" />
          </div>
        ) : isSearching ? (
          /* Search results */
          <section>
            <h2 className="text-lg mb-4 border-b border-ink/10 pb-2">
              {searching
                ? "Searching..."
                : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
            </h2>
            {!searching && searchResults.length === 0 ? (
              <p className="text-center text-ink-muted py-8">
                No questions matching &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <RankingList questions={searchResults} />
            )}
          </section>
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
