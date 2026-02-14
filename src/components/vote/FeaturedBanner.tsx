"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface FeaturedData {
  id: string;
  prompt: string;
  categoryName: string;
  totalVotes: number;
  winnerName: string | null;
  winnerPercentage: number;
}

export function FeaturedBanner() {
  const [featured, setFeatured] = useState<FeaturedData | null>(null);

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((data) => setFeatured(data.featured))
      .catch(() => {});
  }, []);

  if (!featured) return null;

  return (
    <Link
      href="/daily"
      className="block border border-gold/40 bg-white mb-6 hover:shadow-card-hover transition-shadow group"
    >
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="featured">Question of the Day</Badge>
          <Badge variant="category">{featured.categoryName}</Badge>
        </div>
        <p className="font-headline text-base font-bold group-hover:text-arena-red transition-colors">
          {featured.prompt}
        </p>
        {featured.winnerName && (
          <div className="flex items-center gap-3 mt-2">
            <span className="font-ui text-xs text-ink-muted truncate">
              {featured.winnerName}
            </span>
            <div className="flex-1 max-w-32">
              <ProgressBar
                percentage={featured.winnerPercentage}
                isWinner={true}
                animate={false}
              />
            </div>
            <span className="font-mono text-xs text-ink-light">
              {featured.winnerPercentage}%
            </span>
            <span className="font-mono text-xs text-ink-light">
              {featured.totalVotes.toLocaleString()} votes
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
