"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Option {
  id: string;
  name: string;
  subtitle?: string | null;
}

interface Result {
  optionId: string;
  name: string;
  voteCount: number;
  percentage: number;
  isWinner: boolean;
}

interface QuestionData {
  id: string;
  prompt: string;
  subtitle?: string | null;
  categoryName: string;
  options: Option[];
}

interface ResultsData {
  totalVotes: number;
  results: Result[];
}

export default function EmbedPage() {
  const params = useParams();
  const questionId = params.questionId as string;
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/questions/${questionId}`)
      .then((r) => r.json())
      .then((data) => setQuestion(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [questionId]);

  const handleVote = useCallback(
    async (optionId: string) => {
      if (voting || voted) return;
      setVoting(true);
      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, optionId }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults({ totalVotes: data.totalVotes, results: data.results });
          setVoted(true);
        } else if (res.status === 409) {
          // Already voted — fetch results
          const resData = await fetch(
            `/api/questions/${questionId}/results`
          ).then((r) => r.json());
          setResults(resData);
          setVoted(true);
        }
      } catch {
        // ignore
      } finally {
        setVoting(false);
      }
    },
    [questionId, voting, voted]
  );

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-5 w-3/4 bg-cream-dark mb-3" />
        <div className="h-12 bg-cream-dark mb-2" />
        <div className="h-12 bg-cream-dark" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-4 text-center text-sm text-ink-muted">
        Question not found.
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Question */}
      <p className="font-ui text-[9px] uppercase tracking-widest text-ink-muted mb-1">
        {question.categoryName}
      </p>
      <h2 className="font-headline text-base md:text-lg font-bold leading-tight mb-3">
        {question.prompt}
      </h2>

      {!voted ? (
        /* Voting state */
        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={voting}
              className="w-full text-left border border-ink/10 px-4 py-3 hover:bg-ink/[0.03] active:bg-ink/[0.06] transition-colors cursor-pointer disabled:opacity-50 group"
            >
              <span className="font-headline text-sm font-bold group-hover:text-arena-red transition-colors">
                {opt.name}
              </span>
              {opt.subtitle && (
                <span className="block text-xs text-ink-muted font-ui mt-0.5">
                  {opt.subtitle}
                </span>
              )}
            </button>
          ))}
          {voting && (
            <p className="text-center text-xs text-ink-muted font-ui animate-pulse">
              Submitting...
            </p>
          )}
        </div>
      ) : results ? (
        /* Results state */
        <div className="space-y-2">
          {results.results.map((r) => (
            <div key={r.optionId} className="py-2">
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className={`font-headline text-sm font-bold ${
                    r.isWinner ? "text-arena-red" : ""
                  }`}
                >
                  {r.name}
                </span>
                <span className="font-mono text-sm font-bold">
                  {r.percentage}%
                </span>
              </div>
              <ProgressBar
                percentage={r.percentage}
                isWinner={r.isWinner}
                animate={true}
              />
            </div>
          ))}
          <p className="text-center font-mono text-[10px] text-ink-light mt-2">
            {results.totalVotes.toLocaleString()} votes
          </p>
        </div>
      ) : null}

      {/* Attribution */}
      <div className="border-t border-ink/10 mt-4 pt-3 text-center">
        <a
          href={`https://who-did-it-best.vercel.app/${questionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui text-[9px] uppercase tracking-widest text-ink-light hover:text-arena-red transition-colors"
        >
          Powered by Who Did It Best?
        </a>
      </div>
    </div>
  );
}
