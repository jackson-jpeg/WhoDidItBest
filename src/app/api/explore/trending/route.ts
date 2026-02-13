import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories, votes } from "@/lib/db/schema";
import { eq, sql, gte, desc } from "drizzle-orm";

export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get questions sorted by recent vote velocity
    const trendingRows = await db
      .select({
        questionId: votes.questionId,
        recentVotes: sql<number>`count(*)`.as("recent_votes"),
      })
      .from(votes)
      .where(gte(votes.createdAt, oneDayAgo))
      .groupBy(votes.questionId)
      .orderBy(desc(sql`count(*)`))
      .limit(20);

    if (trendingRows.length === 0) {
      // Fallback: return most-voted questions overall
      const fallbackRows = await db
        .select({
          id: questions.id,
          prompt: questions.prompt,
          subtitle: questions.subtitle,
          categoryId: questions.categoryId,
          categoryName: categories.name,
          categorySlug: categories.slug,
          totalVotes: questions.totalVotes,
          tags: questions.tags,
        })
        .from(questions)
        .innerJoin(categories, eq(questions.categoryId, categories.id))
        .where(eq(questions.status, "active"))
        .orderBy(desc(questions.totalVotes))
        .limit(20);

      const questionIds = fallbackRows.map((q) => q.id);
      const allOptions = questionIds.length > 0
        ? await db
            .select({
              id: options.id,
              questionId: options.questionId,
              name: options.name,
              subtitle: options.subtitle,
              sortOrder: options.sortOrder,
              voteCount: options.voteCount,
            })
            .from(options)
            .where(
              sql`${options.questionId} IN (${sql.join(
                questionIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
        : [];

      const optionsByQ = new Map<string, typeof allOptions>();
      for (const o of allOptions) {
        const arr = optionsByQ.get(o.questionId) ?? [];
        arr.push(o);
        optionsByQ.set(o.questionId, arr);
      }

      return NextResponse.json({
        questions: fallbackRows.map((q) => ({
          ...q,
          recentVotes: 0,
          options: (optionsByQ.get(q.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
        })),
      });
    }

    const trendingIds = trendingRows.map((r) => r.questionId);

    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        subtitle: questions.subtitle,
        categoryId: questions.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        totalVotes: questions.totalVotes,
        tags: questions.tags,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        sql`${questions.id} IN (${sql.join(
          trendingIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const questionIds = questionRows.map((q) => q.id);
    const allOptions = questionIds.length > 0
      ? await db
          .select({
            id: options.id,
            questionId: options.questionId,
            name: options.name,
            subtitle: options.subtitle,
            sortOrder: options.sortOrder,
            voteCount: options.voteCount,
          })
          .from(options)
          .where(
            sql`${options.questionId} IN (${sql.join(
              questionIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
      : [];

    const optionsByQ = new Map<string, typeof allOptions>();
    for (const o of allOptions) {
      const arr = optionsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optionsByQ.set(o.questionId, arr);
    }

    // Reattach recent vote counts and sort
    const recentVoteMap = new Map(
      trendingRows.map((r) => [r.questionId, r.recentVotes])
    );

    const result = questionRows
      .map((q) => ({
        ...q,
        recentVotes: recentVoteMap.get(q.id) ?? 0,
        options: (optionsByQ.get(q.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .sort((a, b) => b.recentVotes - a.recentVotes);

    return NextResponse.json({ questions: result });
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json(
      { error: "Failed to load trending" },
      { status: 500 }
    );
  }
}
