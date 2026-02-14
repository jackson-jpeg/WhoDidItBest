import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { questions, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Prevent static prerendering — DB is only available at runtime
export const dynamic = "force-dynamic";

const BASE_URL = "https://who-did-it-best.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/submit`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/history`, changeFrequency: "daily", priority: 0.4 },
    { url: `${BASE_URL}/recap`, changeFrequency: "weekly", priority: 0.4 },
  ];

  // Category pages
  const allCategories = await db
    .select({ slug: categories.slug })
    .from(categories);

  const categoryPages: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: `${BASE_URL}/explore/${c.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Question pages (votable + detail)
  const allQuestions = await db
    .select({ id: questions.id, updatedAt: questions.updatedAt })
    .from(questions)
    .where(eq(questions.status, "active"));

  const questionPages: MetadataRoute.Sitemap = allQuestions.flatMap((q) => [
    {
      url: `${BASE_URL}/${q.id}`,
      lastModified: q.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/explore/question/${q.id}`,
      lastModified: q.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
  ]);

  return [...staticPages, ...categoryPages, ...questionPages];
}
