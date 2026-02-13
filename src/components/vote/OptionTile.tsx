"use client";

import type { VoteOption } from "@/lib/types";

interface OptionTileProps {
  option: VoteOption;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function OptionTile({ option, onSelect, disabled }: OptionTileProps) {
  return (
    <button
      onClick={() => onSelect(option.id)}
      disabled={disabled}
      className="w-full text-left border border-ink/10 p-6 transition-colors hover:bg-ink/[0.03] active:bg-ink/[0.06] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
    >
      <span className="block font-headline text-xl md:text-2xl font-bold group-hover:text-arena-red transition-colors">
        {option.name}
      </span>
      {option.subtitle && (
        <span className="block mt-1 text-sm text-ink-muted font-ui">
          {option.subtitle}
        </span>
      )}
    </button>
  );
}
