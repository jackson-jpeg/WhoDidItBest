import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  questions,
  options,
  categories,
  votes,
  arguments_,
} from "@/lib/db/schema";
import { eq, sql, gte, desc } from "drizzle-orm";

export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Total platform stats
    const totalVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes);
    const totalVotes = Number(totalVotesResult[0]?.count ?? 0);

    const totalQuestionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.status, "active"));
    const totalQuestions = Number(totalQuestionsResult[0]?.count ?? 0);

    const totalArgumentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(arguments_);
    const totalArguments = Number(totalArgumentsResult[0]?.count ?? 0);

    // Votes today
    const todayVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(gte(votes.createdAt, oneDayAgo));
    const votesToday = Number(todayVotesResult[0]?.count ?? 0);

    // Hottest question right now (most votes in last 24h)
    const hotRows = await db
      .select({
        questionId: votes.questionId,
        recentVotes: sql<number>`count(*)`.as("recent_votes"),
      })
      .from(votes)
      .where(gte(votes.createdAt, oneDayAgo))
      .groupBy(votes.questionId)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    let hottestQuestion = null;
    if (hotRows.length > 0) {
      const q = await db
        .select({
          id: questions.id,
          prompt: questions.prompt,
          categoryName: categories.name,
          totalVotes: questions.totalVotes,
        })
        .from(questions)
        .innerJoin(categories, eq(questions.categoryId, categories.id))
        .where(eq(questions.id, hotRows[0].questionId))
        .limit(1);

      if (q.length > 0) {
        hottestQuestion = {
          ...q[0],
          recentVotes: hotRows[0].recentVotes,
        };
      }
    }

    // Most controversial (closest to 50/50, min 5 votes)
    const controversialQs = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        categoryName: categories.name,
        totalVotes: questions.totalVotes,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(sql`${questions.status} = 'active' AND ${questions.totalVotes} >= 5`)
      .orderBy(desc(questions.totalVotes))
      .limit(50);

    let mostControversial = null;
    if (controversialQs.length > 0) {
      const cIds = controversialQs.map((q) => q.id);
      const cOpts = await db
        .select({
          questionId: options.questionId,
          voteCount: options.voteCount,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            cIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      const optsByQ = new Map<string, number[]>();
      for (const o of cOpts) {
        const arr = optsByQ.get(o.questionId) ?? [];
        arr.push(o.voteCount);
        optsByQ.set(o.questionId, arr);
      }

      let bestScore = -1;
      for (const q of controversialQs) {
        const counts = optsByQ.get(q.id) ?? [];
        if (counts.length < 2) continue;
        const top = Math.max(...counts);
        const topProp = top / q.totalVotes;
        const controversy = 1 - Math.abs(0.5 - topProp) * 2;
        if (controversy > bestScore) {
          bestScore = controversy;
          const splitPct = Math.round(topProp * 100);
          mostControversial = {
            ...q,
            splitPercentage: splitPct,
          };
        }
      }
    }

    // Biggest blowout (most lopsided, min 5 votes)
    let biggestBlowout = null;
    if (controversialQs.length > 0) {
      const cIds = controversialQs.map((q) => q.id);
      const bOpts = await db
        .select({
          questionId: options.questionId,
          name: options.name,
          voteCount: options.voteCount,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            cIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      const optsByQ = new Map<string, typeof bOpts>();
      for (const o of bOpts) {
        const arr = optsByQ.get(o.questionId) ?? [];
        arr.push(o);
        optsByQ.set(o.questionId, arr);
      }

      let bestBlowout = 0;
      for (const q of controversialQs) {
        const opts = optsByQ.get(q.id) ?? [];
        if (opts.length < 2) continue;
        const top = opts.reduce((a, b) => (a.voteCount > b.voteCount ? a : b));
        const topPct = Math.round((top.voteCount / q.totalVotes) * 100);
        if (topPct > bestBlowout) {
          bestBlowout = topPct;
          biggestBlowout = {
            ...q,
            winnerName: top.name,
            winnerPercentage: topPct,
          };
        }
      }
    }

    // Category breakdown (votes per category this week)
    const categoryStats = await db
      .select({
        categoryName: categories.name,
        iconEmoji: categories.iconEmoji,
        voteCount: sql<number>`count(*)`.as("cnt"),
      })
      .from(votes)
      .innerJoin(questions, eq(votes.questionId, questions.id))
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(gte(votes.createdAt, oneWeekAgo))
      .groupBy(categories.name, categories.iconEmoji)
      .orderBy(desc(sql`count(*)`));

    return NextResponse.json({
      totalVotes,
      totalQuestions,
      totalArguments,
      votesToday,
      hottestQuestion,
      mostControversial,
      biggestBlowout,
      categoryStats: categoryStats.map((c) => ({
        name: c.categoryName,
        emoji: c.iconEmoji,
        votes: Number(c.voteCount),
      })),
    });
  } catch (error) {
    console.error("Pulse error:", error);
    return NextResponse.json(
      { error: "Failed to load pulse" },
      { status: 500 }
    );
  }
}
