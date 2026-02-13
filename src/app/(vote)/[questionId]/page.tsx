"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VoteCard } from "@/components/vote/VoteCard";
import { VoteCardSkeleton } from "@/components/vote/VoteCardSkeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { RankingList } from "@/components/explore/RankingList";
import type { VotePrompt } from "@/lib/types";

interface RelatedQuestion {
  id: string;
  prompt: string;
  totalVotes: number;
  options: { name: string; voteCount: number }[];
  winner: { name: string; voteCount: number } | null;
}

export default function QuestionPage() {
  const params = useParams();
  const questionId = params.questionId as string;
  const [question, setQuestion] = useState<VotePrompt | null>(null);
  const [related, setRelated] = useState<RelatedQuestion[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch(`/api/questions/${questionId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Question not found");
          throw new Error("Failed to load question");
        }
        const data = await res.json();
        setQuestion(data);

        // Fetch related questions from same category
        if (data.categorySlug) {
          fetch(`/api/explore/${data.categorySlug}`)
            .then((r) => r.json())
            .then((catData) => {
              const others = (catData.questions ?? [])
                .filter((q: RelatedQuestion) => q.id !== questionId)
                .slice(0, 3);
              setRelated(others);
            })
            .catch(() => {}); // non-critical
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [questionId]);

  // Detect when the user votes (VoteCard transitions to revealed)
  // We observe this via a MutationObserver-free approach:
  // wrap onNextQuestion to set hasVoted
  const handlePostVote = () => {
    setHasVoted(true);
  };

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <VoteCardSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="mb-2">Oops</h2>
            <p className="text-ink-muted">{error}</p>
          </div>
        ) : question ? (
          <>
            <VoteCard
              question={question}
              onNextQuestion={handlePostVote}
            />

            {/* After voting, show call-to-action */}
            {hasVoted && (
              <div className="mt-6 text-center border border-ink/10 bg-white px-6 py-8">
                <h3 className="mb-2">Want more?</h3>
                <p className="text-ink-muted text-sm mb-4">
                  Jump into the full feed and keep the votes rolling.
                </p>
                <Link
                  href="/"
                  className="inline-block font-ui uppercase tracking-wide text-sm font-semibold px-6 py-3 bg-arena-red text-cream hover:bg-arena-red/90 border border-arena-red transition-colors"
                >
                  Keep Voting
                </Link>
              </div>
            )}

            {/* Related questions from same category */}
            {related.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg mb-3 border-b border-ink/10 pb-2">
                  More in {question.categoryName}
                </h3>
                <RankingList questions={related} />
              </div>
            )}
          </>
        ) : null}
      </PageContainer>
      <Footer />
    </>
  );
}
