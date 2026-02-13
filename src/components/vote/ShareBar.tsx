"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { nextLinkVariants } from "@/lib/animations";

interface ShareBarProps {
  questionId: string;
  prompt: string;
  winnerName: string;
  winnerPercentage: number;
}

export function ShareBar({
  questionId,
  prompt,
  winnerName,
  winnerPercentage,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${questionId}`
      : `/${questionId}`;

  const shareText = `I voted on '${prompt}' — ${winnerName} is winning with ${winnerPercentage}%! Cast your vote:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  return (
    <motion.div
      className="mt-4 flex items-center justify-center gap-3"
      variants={nextLinkVariants}
      initial="hidden"
      animate="visible"
    >
      <button
        onClick={handleCopyLink}
        className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink border border-ink/15 px-3 py-2 transition-colors cursor-pointer"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>

      <button
        onClick={handleTwitterShare}
        className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink border border-ink/15 px-3 py-2 transition-colors cursor-pointer"
      >
        Share on X
      </button>

      <button
        onClick={handleNativeShare}
        className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-ink border border-ink/15 px-3 py-2 transition-colors cursor-pointer"
      >
        Share
      </button>
    </motion.div>
  );
}
