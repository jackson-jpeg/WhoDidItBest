"use client";

import { useState } from "react";
import Image from "next/image";
import type { VoteOption } from "@/lib/types";

interface OptionTileProps {
  option: VoteOption;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function OptionTile({ option, onSelect, disabled }: OptionTileProps) {
  const [selected, setSelected] = useState(false);

  const handleClick = () => {
    setSelected(true);
    onSelect(option.id);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left border p-6 transition-all cursor-pointer group ${
        selected
          ? "border-arena-red bg-arena-red/5 shadow-[inset_0_0_0_1px_rgba(230,57,70,0.3)]"
          : "border-ink/10 hover:bg-ink/[0.03] active:bg-ink/[0.06]"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
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
        <div className="min-w-0 flex-1">
          <span
            className={`block font-headline text-xl md:text-2xl font-bold transition-colors ${
              selected ? "text-arena-red" : "group-hover:text-arena-red"
            }`}
          >
            {option.name}
          </span>
          {option.subtitle && (
            <span className="block mt-1 text-sm text-ink-muted font-ui">
              {option.subtitle}
            </span>
          )}
        </div>
        {selected && (
          <span className="shrink-0 font-ui text-[10px] uppercase tracking-widest text-arena-red animate-pulse">
            Locked In
          </span>
        )}
      </div>
    </button>
  );
}
