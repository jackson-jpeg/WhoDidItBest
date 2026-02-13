"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { RankingList } from "@/components/explore/RankingList";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconEmoji: string | null;
}

interface CategoryQuestion {
  id: string;
  prompt: string;
  totalVotes: number;
  options: { name: string; voteCount: number }[];
  winner: { name: string; voteCount: number } | null;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.category as string;
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [questions, setQuestions] = useState<CategoryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/explore/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Category not found");
        return r.json();
      })
      .then((data) => {
        setCategory(data.category);
        setQuestions(data.questions);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong")
      )
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/3 bg-cream-dark" />
            <div className="h-6 w-2/3 bg-cream-dark" />
            <div className="h-64 bg-cream-dark mt-8" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="mb-2">Not Found</h2>
            <p className="text-ink-muted mb-4">{error}</p>
            <Link
              href="/explore"
              className="font-ui text-sm uppercase tracking-wide text-arena-red underline underline-offset-4"
            >
              Back to Explore
            </Link>
          </div>
        ) : category ? (
          <>
            <div className="mb-8">
              <Link
                href="/explore"
                className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
              >
                &larr; All Categories
              </Link>
              <h1 className="mt-3">
                {category.iconEmoji} {category.name}
              </h1>
              {category.description && (
                <p className="text-ink-muted mt-1">{category.description}</p>
              )}
            </div>

            <RankingList
              questions={questions}
              basePath="/explore/question"
            />
          </>
        ) : null}
      </PageContainer>
      <Footer />
    </>
  );
}
