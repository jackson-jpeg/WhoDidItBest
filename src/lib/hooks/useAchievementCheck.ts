"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

const STORAGE_KEY = "wdib_unlocked_achievements";

function getStoredUnlocked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function storeUnlocked(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useAchievementCheck() {
  const { toast } = useToast();

  const checkAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      if (!res.ok) return;
      const data = await res.json();

      const stored = getStoredUnlocked();
      const newUnlocks: { emoji: string; name: string }[] = [];

      for (const achievement of data.achievements ?? []) {
        if (achievement.unlocked && !stored.has(achievement.id)) {
          newUnlocks.push({ emoji: achievement.emoji, name: achievement.name });
          stored.add(achievement.id);
        }
      }

      if (newUnlocks.length > 0) {
        storeUnlocked(stored);
        // Show toast for each new unlock (staggered)
        for (let i = 0; i < newUnlocks.length; i++) {
          setTimeout(() => {
            toast(
              `${newUnlocks[i].emoji} Achievement Unlocked: ${newUnlocks[i].name}`,
              3500
            );
          }, i * 800);
        }
      }
    } catch {
      // Silent fail — achievements are non-critical
    }
  }, [toast]);

  return { checkAchievements };
}
