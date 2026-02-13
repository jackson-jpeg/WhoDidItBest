"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VoteCard } from "@/components/vote/VoteCard";
import { VoteCardSkeleton } from "@/components/vote/VoteCardSkeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import type { VotePrompt } from "@/lib/types";

export default function QuestionPage() {
  const params = useParams();
  const questionId = params.questionId as string;
  const [question, setQuestion] = useState<VotePrompt | null>(null);
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
          <VoteCard question={question} />
        ) : null}
      </PageContainer>
      <Footer />
    </>
  );
}
