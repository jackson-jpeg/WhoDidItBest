"use client";

import Image from "next/image";
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
      <div className="flex items-center gap-4">
        {option.imageUrl && (
          <div className="shrink-0 w-14 h-14 border border-ink/10 overflow-hidden bg-cream-dark">
            <Image
              src={option.imageUrl}
              alt={option.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <span className="block font-headline text-xl md:text-2xl font-bold group-hover:text-arena-red transition-colors">
            {option.name}
          </span>
          {option.subtitle && (
            <span className="block mt-1 text-sm text-ink-muted font-ui">
              {option.subtitle}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
