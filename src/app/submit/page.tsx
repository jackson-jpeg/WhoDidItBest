"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OptionTile } from "@/components/vote/OptionTile";
import { VSBadge } from "@/components/vote/VSBadge";

interface CategoryOption {
  name: string;
  slug: string;
  iconEmoji: string | null;
}

export default function SubmitPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [prompt, setPrompt] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [optionNames, setOptionNames] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/explore/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []));
  }, []);

  const addOption = () => {
    if (optionNames.length < 4) {
      setOptionNames([...optionNames, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (optionNames.length > 2) {
      setOptionNames(optionNames.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...optionNames];
    updated[index] = value;
    setOptionNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      setError("Write your question first!");
      return;
    }
    if (!categorySlug) {
      setError("Pick a category.");
      return;
    }
    if (filledOptions.length < 2) {
      setError("Need at least 2 options.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          subtitle: subtitle.trim() || undefined,
          categorySlug,
          optionNames: filledOptions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const filledOptions = optionNames.filter((n) => n.trim().length > 0);

  const resetForm = () => {
    setPrompt("");
    setSubtitle("");
    setCategorySlug("");
    setOptionNames(["", ""]);
    setSubmitted(false);
    setError(null);
  };

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-8">
          <h1 className="mb-2">Submit a Question</h1>
          <p className="text-ink-muted">
            Got a debate that needs settling? Submit your matchup and let the
            crowd decide.
          </p>
        </div>

        {submitted ? (
          <div className="border border-ink/10 bg-white p-8 text-center">
            <div className="text-4xl mb-4">&#9989;</div>
            <h2 className="mb-2">Submitted!</h2>
            <p className="text-ink-muted text-sm mb-6">
              Your question is in the queue. It&apos;ll go live after a quick
              review.
            </p>
            <Button onClick={resetForm} variant="secondary">
              Submit Another
            </Button>
          </div>
        ) : (
          <>
          <form
            onSubmit={handleSubmit}
            className="border border-ink/10 bg-white"
          >
            {/* Question prompt */}
            <div className="px-6 py-5 border-b border-ink/10">
              <label className="block font-ui text-xs uppercase tracking-widest text-ink-muted mb-2">
                Your Question
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Who sang Hallelujah the best?"'
                maxLength={200}
                className="w-full font-headline text-xl font-bold bg-transparent border-b border-ink/10 pb-2 outline-none placeholder:text-ink-light/50 focus:border-arena-red transition-colors"
              />
              <p className="font-mono text-[10px] text-ink-light mt-1 text-right">
                {prompt.length}/200
              </p>

              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional subtitle or context"
                className="w-full text-sm text-ink-muted bg-transparent border-b border-ink/5 pb-1 mt-2 outline-none placeholder:text-ink-light/40 focus:border-ink/20 transition-colors"
              />
            </div>

            {/* Category */}
            <div className="px-6 py-5 border-b border-ink/10">
              <label className="block font-ui text-xs uppercase tracking-widest text-ink-muted mb-3">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setCategorySlug(cat.slug)}
                    className={`font-ui text-xs uppercase tracking-wide px-3 py-1.5 border cursor-pointer transition-colors ${
                      categorySlug === cat.slug
                        ? "border-arena-red text-arena-red bg-arena-red/5"
                        : "border-ink/10 text-ink-muted hover:border-ink/30"
                    }`}
                  >
                    {cat.iconEmoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="px-6 py-5 border-b border-ink/10">
              <label className="block font-ui text-xs uppercase tracking-widest text-ink-muted mb-3">
                Options (2&ndash;4)
              </label>
              <div className="space-y-3">
                {optionNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-light w-5 shrink-0">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      maxLength={100}
                      className="flex-1 bg-transparent border-b border-ink/10 pb-1 outline-none placeholder:text-ink-light/40 focus:border-arena-red transition-colors"
                    />
                    {optionNames.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-ink-light hover:text-arena-red text-xs cursor-pointer"
                      >
                        &#10005;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {optionNames.length < 4 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="font-ui text-xs uppercase tracking-wide text-ink-muted hover:text-ink mt-3 cursor-pointer"
                >
                  + Add Option
                </button>
              )}
            </div>

            {/* Submit */}
            <div className="px-6 py-5">
              {error && (
                <p className="font-ui text-xs text-arena-red mb-3">{error}</p>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Question"}
              </Button>
            </div>
          </form>

          {/* Live preview */}
          {prompt.trim() && (
            <div className="mt-8">
              <h2 className="text-lg mb-3 border-b border-ink/10 pb-2">
                Preview
              </h2>
              <div className="border border-ink/10 bg-white shadow-card opacity-90">
                <div className="border-b border-ink/10 px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="category">
                      {selectedCategory?.iconEmoji}{" "}
                      {selectedCategory?.name ?? "Category"}
                    </Badge>
                  </div>
                  <h2 className="text-xl md:text-2xl">{prompt}</h2>
                  {subtitle.trim() && (
                    <p className="text-ink-muted text-sm mt-1">{subtitle}</p>
                  )}
                </div>
                <div className="px-6 py-6">
                  {filledOptions.length === 2 ? (
                    <div className="space-y-0">
                      <OptionTile
                        option={{ id: "p1", name: filledOptions[0], sortOrder: 0 }}
                        onSelect={() => {}}
                        disabled
                      />
                      <div className="relative py-2">
                        <VSBadge />
                      </div>
                      <OptionTile
                        option={{ id: "p2", name: filledOptions[1], sortOrder: 1 }}
                        onSelect={() => {}}
                        disabled
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filledOptions.map((name, i) => (
                        <OptionTile
                          key={i}
                          option={{ id: `p${i}`, name, sortOrder: i }}
                          onSelect={() => {}}
                          disabled
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
