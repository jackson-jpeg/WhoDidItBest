import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories, impressions } from "@/lib/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { getSessionId } from "@/lib/session";
import { rankFeedQuestions } from "@/lib/feed-algorithm";

export async function GET() {
  try {
    const sessionId = await getSessionId();

    // Get ALL question IDs this session has already seen (voted, skipped, or shown)
    const seenRows = await db
      .select({ questionId: impressions.questionId })
      .from(impressions)
      .where(eq(impressions.sessionId, sessionId));

    const seenQuestionIds = seenRows.map((r) => r.questionId);

    // Fetch active questions not yet seen
    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        subtitle: questions.subtitle,
        categoryId: questions.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        tags: questions.tags,
        totalVotes: questions.totalVotes,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        seenQuestionIds.length > 0
          ? and(
              eq(questions.status, "active"),
              notInArray(questions.id, seenQuestionIds)
            )
          : eq(questions.status, "active")
      );

    // Fetch options for these questions
    const questionIds = questionRows.map((q) => q.id);
    let allOptions: { id: string; questionId: string; name: string; subtitle: string | null; imageUrl: string | null; sortOrder: number; voteCount: number }[] = [];

    if (questionIds.length > 0) {
      allOptions = await db
        .select({
          id: options.id,
          questionId: options.questionId,
          name: options.name,
          subtitle: options.subtitle,
          imageUrl: options.imageUrl,
          sortOrder: options.sortOrder,
          voteCount: options.voteCount,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            questionIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
    }

    // Group options by question
    const optionsByQuestion = new Map<string, typeof allOptions>();
    for (const opt of allOptions) {
      const existing = optionsByQuestion.get(opt.questionId) ?? [];
      existing.push(opt);
      optionsByQuestion.set(opt.questionId, existing);
    }

    // Build feed question objects
    const feedQuestions = questionRows.map((q) => ({
      ...q,
      options: (optionsByQuestion.get(q.id) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder
      ),
    }));

    // Rank by feed algorithm
    const ranked = rankFeedQuestions(feedQuestions);

    // Return top 10
    const batch = ranked.slice(0, 10).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      subtitle: q.subtitle,
      categoryId: q.categoryId,
      categoryName: q.categoryName,
      categorySlug: q.categorySlug,
      tags: q.tags,
      totalVotes: q.totalVotes,
      options: q.options.map((o) => ({
        id: o.id,
        name: o.name,
        subtitle: o.subtitle,
        imageUrl: o.imageUrl,
        sortOrder: o.sortOrder,
      })),
    }));

    return NextResponse.json({
      questions: batch,
      remaining: questionRows.length - batch.length,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: "Failed to load feed" },
      { status: 500 }
    );
  }
}
