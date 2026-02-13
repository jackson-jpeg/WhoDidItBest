import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, questions, options } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categorySlug } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") ?? "votes";

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

    // Determine sort order
    let orderByClause;
    switch (sort) {
      case "newest":
        orderByClause = desc(questions.createdAt);
        break;
      case "controversial":
        // Will sort in JS after fetching options
        orderByClause = desc(questions.totalVotes);
        break;
      case "votes":
      default:
        orderByClause = desc(questions.totalVotes);
        break;
    }

    // Fetch questions in this category
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
      .orderBy(orderByClause);

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

    let questionsWithOptions = questionRows.map((q) => {
      const opts = (optionsByQ.get(q.id) ?? []).sort(
        (a, b) => b.voteCount - a.voteCount
      );
      return {
        ...q,
        options: opts,
        winner: opts[0] ?? null,
      };
    });

    // For "controversial" sort: order by how close the top option is to 50%
    if (sort === "controversial") {
      questionsWithOptions.sort((a, b) => {
        const aScore = controversyScore(a.options, a.totalVotes);
        const bScore = controversyScore(b.options, b.totalVotes);
        return bScore - aScore;
      });
    }

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

function controversyScore(
  opts: { voteCount: number }[],
  totalVotes: number
): number {
  if (totalVotes === 0 || opts.length === 0) return 0;
  const topVoteCount = Math.max(...opts.map((o) => o.voteCount));
  const topProportion = topVoteCount / totalVotes;
  // 1.0 when perfectly split (50/50), 0.0 when unanimous
  return 1 - Math.abs(0.5 - topProportion) * 2;
}
