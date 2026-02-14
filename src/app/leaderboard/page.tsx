"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { RankingList } from "@/components/explore/RankingList";

const TABS = [
  { key: "hot", label: "Hot Right Now" },
  { key: "controversial", label: "Most Controversial" },
  { key: "most-voted", label: "Most Voted" },
  { key: "newest", label: "Newest" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface OptionData {
  name: string;
  voteCount: number;
}

interface QuestionData {
  id: string;
  prompt: string;
  totalVotes: number;
  options: OptionData[];
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("hot");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?tab=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const ranked = questions.map((q) => {
    const winner = q.options.reduce(
      (a, b) => (a.voteCount > b.voteCount ? a : b),
      q.options[0]
    );
    return { ...q, winner: winner ?? null };
  });

  return (
    <>
      <Navbar />
      <PageContainer>
        <h1 className="text-2xl md:text-3xl mb-2">Leaderboard</h1>
        <p className="text-ink-muted text-sm mb-6">
          The hottest debates and biggest blowouts.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-ui text-xs uppercase tracking-widest px-3 py-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-ink text-cream"
                  : "text-ink-muted hover:text-ink border border-ink/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-0 border border-ink/10 bg-white">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 border-b border-ink/5 bg-cream-dark/30" />
            ))}
          </div>
        ) : (
          <RankingList
            questions={ranked}
            basePath="/explore/question"
          />
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
