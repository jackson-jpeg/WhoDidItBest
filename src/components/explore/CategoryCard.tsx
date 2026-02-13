"use client";

import Link from "next/link";
import type { Category } from "@/lib/types";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/explore/${category.slug}`}
      className="block border border-ink/10 bg-white p-5 hover:shadow-card-hover transition-shadow group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{category.iconEmoji ?? "?"}</span>
        <span className="font-mono text-xs text-ink-light">
          {category.questionCount} questions
        </span>
      </div>
      <h3 className="text-lg group-hover:text-arena-red transition-colors">
        {category.name}
      </h3>
      {category.description && (
        <p className="text-sm text-ink-muted mt-1 line-clamp-2">
          {category.description}
        </p>
      )}
    </Link>
  );
}
