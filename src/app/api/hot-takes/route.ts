import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, votes } from "@/lib/db/schema";
import { eq, sql, gte, desc } from "drizzle-orm";

export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get questions with recent votes
    const hotRows = await db
      .select({
        questionId: votes.questionId,
        recentVotes: sql<number>`count(*)`.as("recent_votes"),
      })
      .from(votes)
      .where(gte(votes.createdAt, oneDayAgo))
      .groupBy(votes.questionId)
      .orderBy(desc(sql`count(*)`))
      .limit(8);

    if (hotRows.length === 0) {
      return NextResponse.json({ takes: [] });
    }

    const qIds = hotRows.map((r) => r.questionId);

    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        totalVotes: questions.totalVotes,
      })
      .from(questions)
      .where(
        sql`${questions.id} IN (${sql.join(
          qIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const allOpts = await db
      .select({
        questionId: options.questionId,
        name: options.name,
        voteCount: options.voteCount,
      })
      .from(options)
      .where(
        sql`${options.questionId} IN (${sql.join(
          qIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const optsByQ = new Map<string, typeof allOpts>();
    for (const o of allOpts) {
      const arr = optsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optsByQ.set(o.questionId, arr);
    }

    const takes = questionRows
      .map((q) => {
        const opts = optsByQ.get(q.id) ?? [];
        const winner = opts.reduce((a, b) =>
          a.voteCount > b.voteCount ? a : b
        );
        const pct =
          q.totalVotes > 0
            ? Math.round((winner.voteCount / q.totalVotes) * 100)
            : 0;

        return {
          id: q.id,
          prompt: q.prompt,
          winnerName: winner.name,
          winnerPct: pct,
          totalVotes: q.totalVotes,
        };
      })
      .filter((t) => t.totalVotes >= 3);

    return NextResponse.json({ takes });
  } catch (error) {
    console.error("Hot takes error:", error);
    return NextResponse.json({ takes: [] });
  }
}
