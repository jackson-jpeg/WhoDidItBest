import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, questions, options } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categorySlug } = await params;

    // Find the category
    const categoryRows = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (categoryRows.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const category = categoryRows[0];

    // Fetch questions in this category sorted by total votes
    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        subtitle: questions.subtitle,
        totalVotes: questions.totalVotes,
        tags: questions.tags,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(eq(questions.categoryId, category.id))
      .orderBy(desc(questions.totalVotes));

    // Fetch options for these questions
    const questionIds = questionRows.map((q) => q.id);
    let allOptions: { id: string; questionId: string; name: string; subtitle: string | null; sortOrder: number; voteCount: number }[] = [];

    if (questionIds.length > 0) {
      allOptions = await db
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
        );
    }

    const optionsByQ = new Map<string, typeof allOptions>();
    for (const o of allOptions) {
      const arr = optionsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optionsByQ.set(o.questionId, arr);
    }

    const questionsWithOptions = questionRows.map((q) => {
      const opts = (optionsByQ.get(q.id) ?? []).sort(
        (a, b) => b.voteCount - a.voteCount
      );
      return {
        ...q,
        options: opts,
        winner: opts[0] ?? null,
      };
    });

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        iconEmoji: category.iconEmoji,
      },
      questions: questionsWithOptions,
    });
  } catch (error) {
    console.error("Category explore error:", error);
    return NextResponse.json(
      { error: "Failed to load category" },
      { status: 500 }
    );
  }
}
