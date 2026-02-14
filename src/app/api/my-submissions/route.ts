import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, categories } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET() {
  try {
    const sessionId = await getSessionId();

    const rows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        status: questions.status,
        totalVotes: questions.totalVotes,
        categoryName: categories.name,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        sql`${questions.metadata}->>'submittedBy' = ${sessionId}`
      )
      .orderBy(desc(questions.createdAt))
      .limit(20);

    return NextResponse.json({
      submissions: rows.map((r) => ({
        id: r.id,
        prompt: r.prompt,
        status: r.status,
        totalVotes: r.totalVotes,
        categoryName: r.categoryName,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("My submissions error:", error);
    return NextResponse.json({ submissions: [] });
  }
}
