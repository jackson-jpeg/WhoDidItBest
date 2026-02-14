"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { nextLinkVariants } from "@/lib/animations";

interface ShareBarProps {
  questionId: string;
  prompt: string;
  winnerName: string;
  winnerPercentage: number;
  votedOptionId?: string;
  votedOptionName?: string;
}

export function ShareBar({
  questionId,
  prompt,
  winnerName,
  winnerPercentage,
  votedOptionId,
  votedOptionName,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const shareUrl = `${origin}/${questionId}`;
  const challengeUrl = votedOptionId
    ? `${origin}/${questionId}?challenge=${votedOptionId}`
    : shareUrl;

  const shareText = votedOptionName
    ? `I picked ${votedOptionName} on "${prompt}" — ${winnerName} is winning with ${winnerPercentage}%. What's your pick?`
    : `${winnerName} is winning "${prompt}" with ${winnerPercentage}%. Cast your vote:`;

  const challengeText = votedOptionName
    ? `I voted ${votedOptionName} on "${prompt}" — do you agree? 🤔`
    : shareText;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
  };

  const handleCopyLink = async () => {
    await copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyChallenge = async () => {
    await copyToClipboard(challengeUrl);
    setChallengeCopied(true);
    setTimeout(() => setChallengeCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Who Did It Best?",
          text: challengeText,
          url: challengeUrl,
        });
      } catch {
        // User cancelled — ignore
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.div
      className="mt-4"
      variants={nextLinkVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {votedOptionId && (
          <button
            onClick={handleCopyChallenge}
            className="font-ui text-xs uppercase tracking-widest text-cream bg-arena-red hover:bg-arena-red/90 border border-arena-red px-3 py-2 transition-colors cursor-pointer"
          >
            {challengeCopied ? "Copied!" : "Challenge a Friend"}
          </button>
        )}

        <button
          onClick={handleTwitterShare}
          className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink border border-ink/15 px-3 py-2 transition-colors cursor-pointer"
        >
          Share on X
        </button>

        <button
          onClick={handleCopyLink}
          className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink border border-ink/15 px-3 py-2 transition-colors cursor-pointer"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <button
          onClick={handleNativeShare}
          className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink border border-ink/15 px-3 py-2 transition-colors cursor-pointer md:hidden"
        >
          Share
        </button>
      </div>
    </motion.div>
  );
}
