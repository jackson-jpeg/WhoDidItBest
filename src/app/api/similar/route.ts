import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories, impressions } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const questionId = request.nextUrl.searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ questions: [] });
    }

    const sessionId = await getSessionId();

    // Get the current question's category
    const current = await db
      .select({ categoryId: questions.categoryId })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (current.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const categoryId = current[0].categoryId;

    // Get questions from the same category that the user hasn't voted on
    const similar = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        totalVotes: questions.totalVotes,
        categoryName: categories.name,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        sql`${questions.categoryId} = ${categoryId}
          AND ${questions.id} != ${questionId}
          AND ${questions.status} = 'active'
          AND ${questions.id} NOT IN (
            SELECT ${impressions.questionId} FROM ${impressions}
            WHERE ${impressions.sessionId} = ${sessionId}
            AND ${impressions.action} = 'voted'
          )`
      )
      .orderBy(desc(questions.totalVotes))
      .limit(3);

    // Get options for these questions
    const sIds = similar.map((s) => s.id);
    const allOpts =
      sIds.length > 0
        ? await db
            .select({
              questionId: options.questionId,
              name: options.name,
              voteCount: options.voteCount,
            })
            .from(options)
            .where(
              sql`${options.questionId} IN (${sql.join(
                sIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
        : [];

    const optsByQ = new Map<string, typeof allOpts>();
    for (const o of allOpts) {
      const arr = optsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optsByQ.set(o.questionId, arr);
    }

    return NextResponse.json({
      questions: similar.map((q) => {
        const opts = optsByQ.get(q.id) ?? [];
        const winner =
          opts.length > 0
            ? opts.reduce((a, b) => (a.voteCount > b.voteCount ? a : b))
            : null;
        return {
          id: q.id,
          prompt: q.prompt,
          totalVotes: q.totalVotes,
          winnerName: winner?.name ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("Similar error:", error);
    return NextResponse.json({ questions: [] });
  }
}
