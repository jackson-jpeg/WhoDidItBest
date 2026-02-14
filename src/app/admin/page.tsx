"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

interface AdminQuestion {
  id: string;
  prompt: string;
  subtitle: string | null;
  status: string;
  totalVotes: number;
  categoryName: string;
  categoryEmoji: string | null;
  metadata: Record<string, unknown> | null;
  options: string[];
  createdAt: string;
}

const STATUS_TABS = [
  { value: "draft", label: "Pending Review" },
  { value: "active", label: "Live" },
  { value: "archived", label: "Archived" },
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [statusFilter, setStatusFilter] = useState("draft");
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions?status=${statusFilter}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter]);

  useEffect(() => {
    if (authenticated) {
      fetchQuestions();
    }
  }, [statusFilter, authenticated, fetchQuestions]);

  const handleLogin = () => {
    if (adminKey.trim()) {
      fetchQuestions();
    }
  };

  const handleAction = async (
    questionId: string,
    action: "approve" | "reject" | "archive"
  ) => {
    setActionLoading(questionId);
    try {
      await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ questionId, action }),
      });
      // Remove from current list
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } finally {
      setActionLoading(null);
    }
  };

  if (!authenticated) {
    return (
      <>
        <Navbar />
        <PageContainer>
          <div className="max-w-sm mx-auto mt-16">
            <h1 className="text-2xl mb-6 text-center">Admin</h1>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Admin key"
              className="w-full border border-ink/15 bg-white px-4 py-3 font-mono text-sm mb-3 focus:outline-none focus:border-ink/30"
            />
            <Button onClick={handleLogin}>Login</Button>
          </div>
        </PageContainer>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl mb-2">Moderation Queue</h1>
          <p className="text-ink-muted text-sm">
            Review and manage submitted questions.
          </p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-6 border-b border-ink/10">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`font-ui text-xs uppercase tracking-widest px-4 py-2.5 transition-colors cursor-pointer border-b-2 -mb-px ${
                statusFilter === tab.value
                  ? "border-arena-red text-arena-red"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-cream-dark" />
            <div className="h-24 bg-cream-dark" />
            <div className="h-24 bg-cream-dark" />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-center text-ink-muted py-12">
            No questions with this status.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="border border-ink/10 bg-white px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-ui text-[10px] uppercase tracking-widest text-ink-muted">
                        {q.categoryEmoji} {q.categoryName}
                      </span>
                      <span className="font-mono text-[10px] text-ink-light">
                        {timeAgo(new Date(q.createdAt))}
                      </span>
                    </div>
                    <p className="font-headline text-base font-bold">
                      {q.prompt}
                    </p>
                    {q.subtitle && (
                      <p className="text-ink-muted text-sm mt-0.5">
                        {q.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {q.options.map((opt, i) => (
                        <span
                          key={i}
                          className="font-ui text-xs px-2 py-0.5 border border-ink/10 text-ink-muted"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                    {q.totalVotes > 0 && (
                      <p className="font-mono text-xs text-ink-light mt-2">
                        {q.totalVotes} votes
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {statusFilter === "draft" && (
                      <>
                        <button
                          onClick={() => handleAction(q.id, "approve")}
                          disabled={actionLoading === q.id}
                          className="font-ui text-[10px] uppercase tracking-widest px-3 py-1.5 bg-green-700 text-white hover:bg-green-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(q.id, "reject")}
                          disabled={actionLoading === q.id}
                          className="font-ui text-[10px] uppercase tracking-widest px-3 py-1.5 bg-arena-red text-white hover:bg-arena-red/80 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {statusFilter === "active" && (
                      <button
                        onClick={() => handleAction(q.id, "archive")}
                        disabled={actionLoading === q.id}
                        className="font-ui text-[10px] uppercase tracking-widest px-3 py-1.5 border border-ink/15 text-ink-muted hover:bg-ink/[0.03] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
