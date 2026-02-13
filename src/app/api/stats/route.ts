import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  impressions,
  votes,
  options,
  questions,
  categories,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET() {
  try {
    const sessionId = await getSessionId();

    // Total votes cast
    const voteCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));
    const totalVotes = Number(voteCountResult[0]?.count ?? 0);

    if (totalVotes === 0) {
      return NextResponse.json({
        totalVotes: 0,
        favoriteCategory: null,
        agreementRate: 0,
        questionsSkipped: 0,
      });
    }

    // Favorite category (most votes in)
    const favCatResult = await db
      .select({
        categoryName: categories.name,
        count: sql<number>`count(*)`.as("cnt"),
      })
      .from(votes)
      .innerJoin(questions, eq(votes.questionId, questions.id))
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(votes.sessionId, sessionId))
      .groupBy(categories.name)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    const favoriteCategory = favCatResult[0]?.categoryName ?? null;

    // Agreement rate: how often user voted for the current winner
    const userVoteRows = await db
      .select({
        questionId: votes.questionId,
        optionId: votes.optionId,
      })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));

    let agreements = 0;

    if (userVoteRows.length > 0) {
      const questionIds = userVoteRows.map((v) => v.questionId);

      // Get all options for voted questions
      const allOptions = await db
        .select({
          id: options.id,
          questionId: options.questionId,
          voteCount: options.voteCount,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            questionIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      // Find winner per question
      const winnerByQ = new Map<string, string>();
      const maxByQ = new Map<string, number>();
      for (const o of allOptions) {
        const currentMax = maxByQ.get(o.questionId) ?? -1;
        if (o.voteCount > currentMax) {
          maxByQ.set(o.questionId, o.voteCount);
          winnerByQ.set(o.questionId, o.id);
        }
      }

      for (const v of userVoteRows) {
        if (winnerByQ.get(v.questionId) === v.optionId) {
          agreements++;
        }
      }
    }

    const agreementRate =
      userVoteRows.length > 0
        ? Math.round((agreements / userVoteRows.length) * 100)
        : 0;

    // Questions skipped
    const skipCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(impressions)
      .where(
        and(
          eq(impressions.sessionId, sessionId),
          eq(impressions.action, "skipped")
        )
      );
    const questionsSkipped = Number(skipCountResult[0]?.count ?? 0);

    return NextResponse.json({
      totalVotes,
      favoriteCategory,
      agreementRate,
      questionsSkipped,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
