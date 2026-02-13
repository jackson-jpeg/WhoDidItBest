"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVoteCard } from "@/lib/hooks/useVoteCard";
import { OptionTile } from "./OptionTile";
import { VSBadge } from "./VSBadge";
import { ResultBar } from "./ResultBar";
import { VerdictStamp } from "./VerdictStamp";
import { ShareBar } from "./ShareBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  resultContainerVariants,
  nextLinkVariants,
  pageVariants,
} from "@/lib/animations";
import type { VotePrompt } from "@/lib/types";

interface VoteCardProps {
  question: VotePrompt;
  onNextQuestion?: () => void;
  onSkip?: () => void;
}

export function VoteCard({ question, onNextQuestion, onSkip }: VoteCardProps) {
  const { state, results, selectedOptionId, error, handleVote } =
    useVoteCard(question);

  const isVoting = state === "voting";
  const showResults = state === "revealing" || state === "revealed";

  const winner = results?.results.reduce((a, b) =>
    a.voteCount > b.voteCount ? a : b
  );

  return (
    <motion.div
      className="border border-ink/10 bg-white shadow-card"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="border-b border-ink/10 px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="category">{question.categoryName}</Badge>
          {question.tags?.map((tag) => (
            <Badge key={tag} variant="category">
              {tag}
            </Badge>
          ))}
        </div>
        <h2 className="text-xl md:text-2xl">{question.prompt}</h2>
        {question.subtitle && (
          <p className="text-ink-muted text-sm mt-1">{question.subtitle}</p>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        <AnimatePresence mode="wait">
          {!showResults ? (
            /* ── Voting state ── */
            <motion.div
              key="options"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              {question.options.length === 2 ? (
                /* Two-option layout with VS badge */
                <div className="space-y-0">
                  <OptionTile
                    option={question.options[0]}
                    onSelect={handleVote}
                    disabled={isVoting}
                  />
                  <div className="relative py-2">
                    <VSBadge />
                  </div>
                  <OptionTile
                    option={question.options[1]}
                    onSelect={handleVote}
                    disabled={isVoting}
                  />
                </div>
              ) : (
                /* Multi-option layout */
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <OptionTile
                      key={option.id}
                      option={option}
                      onSelect={handleVote}
                      disabled={isVoting}
                    />
                  ))}
                </div>
              )}

              {isVoting && (
                <div className="mt-4 text-center">
                  <span className="font-ui text-xs uppercase tracking-widest text-ink-muted animate-pulse">
                    Submitting...
                  </span>
                </div>
              )}

              {error && (
                <div className="mt-4 text-center">
                  <span className="font-ui text-xs text-arena-red">
                    {error}
                  </span>
                </div>
              )}

              {/* Skip / Pass */}
              {onSkip && !isVoting && (
                <div className="mt-5 text-center">
                  <button
                    onClick={onSkip}
                    className="font-ui text-xs uppercase tracking-widest text-ink-light hover:text-ink-muted transition-colors cursor-pointer"
                  >
                    Skip &rarr;
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Results state ── */
            <motion.div
              key="results"
              variants={resultContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="space-y-1">
                {results?.results.map((result) => (
                  <ResultBar
                    key={result.optionId}
                    result={{
                      ...result,
                      isUserVote: result.optionId === selectedOptionId,
                    }}
                  />
                ))}
              </div>

              {/* Verdict stamp */}
              {winner && (
                <div className="mt-6 flex justify-center">
                  <VerdictStamp winnerName={winner.name} />
                </div>
              )}

              {/* Total votes */}
              <p className="text-center text-xs text-ink-light font-mono mt-4">
                {results?.totalVotes.toLocaleString()} total votes
              </p>

              {/* Next matchup */}
              {onNextQuestion && (
                <motion.div
                  className="mt-6 flex justify-center"
                  variants={nextLinkVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button variant="primary" onClick={onNextQuestion}>
                    Next Matchup
                  </Button>
                </motion.div>
              )}

              {/* Share bar */}
              {state === "revealed" && winner && (
                <ShareBar
                  questionId={question.id}
                  prompt={question.prompt}
                  winnerName={winner.name}
                  winnerPercentage={winner.percentage}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
