import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        status: questions.status,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(questions.id, id))
      .limit(1);

    if (questionRows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionRows[0];

    const questionOptions = await db
      .select({
        id: options.id,
        name: options.name,
        subtitle: options.subtitle,
        imageUrl: options.imageUrl,
        sortOrder: options.sortOrder,
      })
      .from(options)
      .where(eq(options.questionId, id))
      .orderBy(options.sortOrder);

    return NextResponse.json({
      ...question,
      options: questionOptions,
    });
  } catch (error) {
    console.error("Question fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load question" },
      { status: 500 }
    );
  }
}
