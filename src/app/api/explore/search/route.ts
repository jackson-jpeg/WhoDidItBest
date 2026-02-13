import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Search using ILIKE for simple full-text matching
    const searchPattern = `%${query}%`;

    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        totalVotes: questions.totalVotes,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        sql`${questions.status} = 'active' AND ${questions.prompt} ILIKE ${searchPattern}`
      )
      .orderBy(desc(questions.totalVotes))
      .limit(20);

    if (questionRows.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const questionIds = questionRows.map((q) => q.id);

    const allOptions = await db
      .select({
        id: options.id,
        questionId: options.questionId,
        name: options.name,
        voteCount: options.voteCount,
        sortOrder: options.sortOrder,
      })
      .from(options)
      .where(
        sql`${options.questionId} IN (${sql.join(
          questionIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const optionsByQ = new Map<string, typeof allOptions>();
    for (const o of allOptions) {
      const arr = optionsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optionsByQ.set(o.questionId, arr);
    }

    const results = questionRows.map((q) => {
      const opts = (optionsByQ.get(q.id) ?? []).sort(
        (a, b) => b.voteCount - a.voteCount
      );
      return {
        id: q.id,
        prompt: q.prompt,
        totalVotes: q.totalVotes,
        categoryName: q.categoryName,
        options: opts.map((o) => ({ name: o.name, voteCount: o.voteCount })),
        winner: opts[0] ?? null,
      };
    });

    return NextResponse.json({ questions: results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search questions" },
      { status: 500 }
    );
  }
}
