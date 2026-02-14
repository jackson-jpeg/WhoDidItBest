"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HotTake {
  id: string;
  prompt: string;
  winnerName: string;
  winnerPct: number;
  totalVotes: number;
}

export function HotTakesTicker() {
  const [takes, setTakes] = useState<HotTake[]>([]);

  useEffect(() => {
    fetch("/api/hot-takes")
      .then((r) => r.json())
      .then((data) => setTakes(data.takes ?? []))
      .catch(() => {});
  }, []);

  if (takes.length === 0) return null;

  return (
    <div className="mb-6 border border-ink/10 bg-white overflow-hidden">
      <div className="flex items-center">
        <span className="shrink-0 bg-arena-red text-cream font-ui text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-2">
          Live
        </span>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-[scroll_30s_linear_infinite] gap-8 px-4 py-2">
            {[...takes, ...takes].map((take, i) => (
              <Link
                key={`${take.id}-${i}`}
                href={`/explore/question/${take.id}`}
                className="shrink-0 flex items-center gap-2 text-xs group whitespace-nowrap"
              >
                <span className="font-headline font-bold group-hover:text-arena-red transition-colors">
                  {take.winnerName}
                </span>
                <span className="font-mono text-arena-red font-bold">
                  {take.winnerPct}%
                </span>
                <span className="text-ink-light">
                  {take.prompt}
                </span>
                <span className="text-ink-light/40">&bull;</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
