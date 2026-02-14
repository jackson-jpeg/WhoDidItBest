"use client";

import { motion } from "framer-motion";
import { nextLinkVariants } from "@/lib/animations";
import { useToast } from "@/components/ui/Toast";

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
  const { toast } = useToast();

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
    toast("Link copied!");
  };

  const handleCopyChallenge = async () => {
    await copyToClipboard(challengeUrl);
    toast("Challenge link copied!");
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(
      `${challengeText} ${challengeUrl}`
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      challengeUrl
    )}&text=${encodeURIComponent(challengeText)}`;
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

  const btnBase =
    "font-ui text-xs uppercase tracking-widest border px-3 py-2 transition-colors cursor-pointer";
  const btnSecondary =
    `${btnBase} text-ink-muted hover:text-ink border-ink/15`;

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
            className={`${btnBase} text-cream bg-arena-red hover:bg-arena-red/90 border-arena-red`}
          >
            Challenge a Friend
          </button>
        )}

        <button onClick={handleTwitterShare} className={btnSecondary}>
          X
        </button>

        <button onClick={handleWhatsAppShare} className={btnSecondary}>
          WhatsApp
        </button>

        <button onClick={handleTelegramShare} className={btnSecondary}>
          Telegram
        </button>

        <button onClick={handleCopyLink} className={btnSecondary}>
          Copy Link
        </button>

        <button
          onClick={handleNativeShare}
          className={`${btnSecondary} md:hidden`}
        >
          Share
        </button>
      </div>
    </motion.div>
  );
}
