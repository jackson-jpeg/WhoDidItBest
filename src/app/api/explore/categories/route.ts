import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, questions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        iconEmoji: categories.iconEmoji,
        questionCount: sql<number>`count(${questions.id})`.as("question_count"),
      })
      .from(categories)
      .leftJoin(
        questions,
        eq(categories.id, questions.categoryId)
      )
      .groupBy(categories.id)
      .orderBy(categories.name);

    return NextResponse.json({ categories: categoryRows });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
