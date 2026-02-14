"use client";

import { useEffect, useState } from "react";

export function StreakBadge() {
  const [streak, setStreak] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((data) => {
        setStreak(data.streak ?? 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || streak === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-xs text-arena-red"
      title={`${streak}-day voting streak`}
    >
      <span className="text-sm">&#128293;</span>
      {streak}
    </span>
  );
}
