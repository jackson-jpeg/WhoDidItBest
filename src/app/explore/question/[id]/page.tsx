"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { ResultBar } from "@/components/vote/ResultBar";
import { VerdictStamp } from "@/components/vote/VerdictStamp";
import { ShareBar } from "@/components/vote/ShareBar";
import { ReactionBar } from "@/components/vote/ReactionBar";
import { MakeYourCase } from "@/components/vote/MakeYourCase";
import { Badge } from "@/components/ui/Badge";
import type { VoteResults } from "@/lib/types";

interface QuestionDetail {
  id: string;
  prompt: string;
  subtitle: string | null;
  categoryName: string;
  categorySlug: string;
  tags: string[] | null;
}

export default function QuestionDetailPage() {
  const params = useParams();
  const questionId = params.id as string;
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    const res = await fetch(`/api/questions/${questionId}/results`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
  }, [questionId]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/questions/${questionId}`).then((r) => {
        if (!r.ok) throw new Error("Question not found");
        return r.json();
      }),
      fetch(`/api/questions/${questionId}/results`).then((r) => {
        if (!r.ok) throw new Error("Results not found");
        return r.json();
      }),
    ])
      .then(([qData, rData]) => {
        setQuestion(qData);
        setResults(rData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong")
      )
      .finally(() => setLoading(false));
  }, [questionId]);

  // Poll for updated results every 10 seconds
  useEffect(() => {
    if (loading || error) return;
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [loading, error, fetchResults]);

  const winner = results?.results.reduce((a, b) =>
    a.voteCount > b.voteCount ? a : b
  );

  const winnerPercentage = winner
    ? results && results.totalVotes > 0
      ? Math.round((winner.voteCount / results.totalVotes) * 100)
      : 0
    : 0;

  return (
    <>
      <Navbar />
      <PageContainer>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 bg-cream-dark" />
            <div className="h-6 w-1/2 bg-cream-dark" />
            <div className="h-48 bg-cream-dark mt-6" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="mb-2">Not Found</h2>
            <p className="text-ink-muted">{error}</p>
          </div>
        ) : question && results ? (
          <>
            <div className="mb-6">
              <Link
                href={`/explore/${question.categorySlug}`}
                className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
              >
                &larr; {question.categoryName}
              </Link>
            </div>

            <div className="border border-ink/10 bg-white shadow-card">
              <div className="border-b border-ink/10 px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="category">{question.categoryName}</Badge>
                  {question.tags?.map((tag) => (
                    <Badge key={tag} variant="category">{tag}</Badge>
                  ))}
                </div>
                <h1 className="text-xl md:text-2xl">{question.prompt}</h1>
                {question.subtitle && (
                  <p className="text-ink-muted text-sm mt-1">
                    {question.subtitle}
                  </p>
                )}
              </div>

              <div className="px-6 py-6">
                <div className="space-y-1">
                  {results.results.map((result) => (
                    <ResultBar
                      key={result.optionId}
                      result={result}
                      animate={false}
                    />
                  ))}
                </div>

                {winner && winner.voteCount > 0 && (
                  <div className="mt-6 flex justify-center">
                    <VerdictStamp winnerName={winner.name} />
                  </div>
                )}

                <p className="text-center text-xs text-ink-light font-mono mt-4">
                  {results.totalVotes.toLocaleString()} total votes
                </p>

                <ReactionBar questionId={questionId} />

                <MakeYourCase questionId={questionId} />

                <div className="mt-6 text-center">
                  <Link
                    href={`/${questionId}`}
                    className="font-ui text-sm uppercase tracking-wide text-arena-red underline underline-offset-4"
                  >
                    Vote on this question
                  </Link>
                </div>

                {/* Share */}
                {winner && (
                  <ShareBar
                    questionId={questionId}
                    prompt={question.prompt}
                    winnerName={winner.name}
                    winnerPercentage={winnerPercentage}
                  />
                )}
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
      <Footer />
    </>
  );
}
