"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/utils";

interface Argument {
  id: string;
  optionId: string;
  optionName: string;
  body: string;
  upvotes: number;
  createdAt: string;
  isOwn: boolean;
  hasUpvoted: boolean;
}

interface MakeYourCaseProps {
  questionId: string;
  votedOptionId?: string;
  votedOptionName?: string;
}

export function MakeYourCase({
  questionId,
  votedOptionId,
  votedOptionName,
}: MakeYourCaseProps) {
  const { toast } = useToast();
  const [args, setArgs] = useState<Argument[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchArguments = useCallback(async () => {
    try {
      const res = await fetch(`/api/arguments?questionId=${questionId}`);
      if (res.ok) {
        const data = await res.json();
        setArgs(data.arguments ?? []);
        // Check if user already submitted
        if (data.arguments?.some((a: Argument) => a.isOwn)) {
          setHasSubmitted(true);
        }
      }
    } catch {
      // ignore
    }
  }, [questionId]);

  useEffect(() => {
    fetchArguments();
  }, [fetchArguments]);

  const handleSubmit = async () => {
    if (!body.trim() || !votedOptionId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/arguments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          optionId: votedOptionId,
          body: body.trim(),
        }),
      });
      if (res.ok) {
        setBody("");
        setHasSubmitted(true);
        setShowForm(false);
        toast("Your take is live!");
        fetchArguments();
      }
    } catch {
      toast("Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (argumentId: string) => {
    // Optimistic update
    setArgs((prev) =>
      prev.map((a) =>
        a.id === argumentId
          ? {
              ...a,
              hasUpvoted: !a.hasUpvoted,
              upvotes: a.hasUpvoted ? a.upvotes - 1 : a.upvotes + 1,
            }
          : a
      )
    );

    try {
      const res = await fetch("/api/arguments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote", argumentId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      fetchArguments();
    }
  };

  const remaining = 280 - body.length;

  return (
    <div className="mt-6 border-t border-ink/10 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-ui text-[10px] uppercase tracking-[0.15em] text-ink-muted font-bold">
          Make Your Case
        </h4>
        {args.length > 0 && (
          <span className="font-mono text-[10px] text-ink-light">
            {args.length} take{args.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Submit form */}
      {votedOptionId && !hasSubmitted && (
        <AnimatePresence>
          {!showForm ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowForm(true)}
              className="w-full text-left border border-dashed border-ink/15 px-4 py-3 mb-4 text-sm text-ink-muted hover:border-ink/30 hover:text-ink transition-colors cursor-pointer"
            >
              Why {votedOptionName}? Make your case...
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4"
            >
              <textarea
                value={body}
                onChange={(e) =>
                  setBody(e.target.value.slice(0, 280))
                }
                placeholder={`Why ${votedOptionName}? Keep it sharp...`}
                className="w-full border border-ink/15 bg-white px-4 py-3 text-sm font-body resize-none focus:outline-none focus:border-arena-red/40 transition-colors"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`font-mono text-[10px] ${
                    remaining < 30 ? "text-arena-red" : "text-ink-light"
                  }`}
                >
                  {remaining}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setBody("");
                    }}
                    className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors cursor-pointer px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!body.trim() || submitting}
                    className="font-ui text-xs uppercase tracking-widest bg-ink text-cream px-3 py-1.5 disabled:opacity-40 cursor-pointer transition-colors hover:bg-ink/90"
                  >
                    {submitting ? "..." : "Post"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Arguments list */}
      {args.length > 0 ? (
        <div className="space-y-2">
          {args.slice(0, 5).map((arg) => (
            <div
              key={arg.id}
              className={`border px-4 py-3 ${
                arg.isOwn
                  ? "border-arena-red/20 bg-arena-red/[0.02]"
                  : "border-ink/10 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-ui text-[10px] uppercase tracking-widest text-ink-muted">
                    For {arg.optionName}
                    {arg.isOwn && " · You"}
                  </span>
                  <p className="text-sm mt-1 leading-relaxed">{arg.body}</p>
                </div>
                <button
                  onClick={() => handleUpvote(arg.id)}
                  className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 border transition-colors cursor-pointer ${
                    arg.hasUpvoted
                      ? "border-arena-red/30 bg-arena-red/5 text-arena-red"
                      : "border-ink/10 text-ink-light hover:text-ink hover:border-ink/20"
                  }`}
                >
                  <span className="text-xs leading-none">&#9650;</span>
                  <span className="font-mono text-[10px]">{arg.upvotes}</span>
                </button>
              </div>
              <p className="font-mono text-[9px] text-ink-light mt-1.5">
                {timeAgo(new Date(arg.createdAt))}
              </p>
            </div>
          ))}
          {args.length > 5 && (
            <p className="text-center font-mono text-[10px] text-ink-light py-2">
              +{args.length - 5} more takes
            </p>
          )}
        </div>
      ) : !showForm && !hasSubmitted ? (
        <p className="text-sm text-ink-light text-center py-3">
          No takes yet. Be the first to make your case.
        </p>
      ) : null}
    </div>
  );
}
