import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  impressions,
  questions,
  options,
  categories,
  votes,
} from "@/lib/db/schema";
import { eq, and, sql, desc, lt } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getSessionId();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 20;

    // Get voted impressions for this session
    let query = db
      .select({
        questionId: impressions.questionId,
        votedAt: impressions.createdAt,
      })
      .from(impressions)
      .where(
        cursor
          ? and(
              eq(impressions.sessionId, sessionId),
              eq(impressions.action, "voted"),
              lt(impressions.createdAt, new Date(cursor))
            )
          : and(
              eq(impressions.sessionId, sessionId),
              eq(impressions.action, "voted")
            )
      )
      .orderBy(desc(impressions.createdAt))
      .limit(limit + 1);

    const impressionRows = await query;

    const hasMore = impressionRows.length > limit;
    const rows = impressionRows.slice(0, limit);

    if (rows.length === 0) {
      return NextResponse.json({ votes: [], nextCursor: null });
    }

    const questionIds = rows.map((r) => r.questionId);

    // Fetch questions with categories
    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        totalVotes: questions.totalVotes,
        categoryName: categories.name,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        sql`${questions.id} IN (${sql.join(
          questionIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    // Fetch all options for these questions
    const allOptions = await db
      .select({
        id: options.id,
        questionId: options.questionId,
        name: options.name,
        voteCount: options.voteCount,
      })
      .from(options)
      .where(
        sql`${options.questionId} IN (${sql.join(
          questionIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    // Fetch which option the user voted for
    const userVotes = await db
      .select({
        questionId: votes.questionId,
        optionId: votes.optionId,
      })
      .from(votes)
      .where(
        and(
          eq(votes.sessionId, sessionId),
          sql`${votes.questionId} IN (${sql.join(
            questionIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
      );

    // Build lookup maps
    const questionMap = new Map(questionRows.map((q) => [q.id, q]));
    const optionsByQ = new Map<string, typeof allOptions>();
    for (const o of allOptions) {
      const arr = optionsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optionsByQ.set(o.questionId, arr);
    }
    const userVoteMap = new Map(userVotes.map((v) => [v.questionId, v.optionId]));

    // Build response
    const voteList = rows
      .map((row) => {
        const q = questionMap.get(row.questionId);
        if (!q) return null;

        const opts = optionsByQ.get(row.questionId) ?? [];
        const winner = opts.length > 0
          ? opts.reduce((a, b) => (a.voteCount > b.voteCount ? a : b))
          : null;
        const winnerPercentage =
          winner && q.totalVotes > 0
            ? Math.round((winner.voteCount / q.totalVotes) * 100)
            : 0;

        const votedOptionId = userVoteMap.get(row.questionId);
        const votedOption = opts.find((o) => o.id === votedOptionId);

        return {
          questionId: row.questionId,
          prompt: q.prompt,
          categoryName: q.categoryName,
          votedOptionName: votedOption?.name ?? "Unknown",
          winnerName: winner?.name ?? "Unknown",
          winnerPercentage,
          totalVotes: q.totalVotes,
          votedAt: row.votedAt.toISOString(),
        };
      })
      .filter(Boolean);

    const nextCursor = hasMore
      ? rows[rows.length - 1].votedAt.toISOString()
      : null;

    return NextResponse.json({ votes: voteList, nextCursor });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Failed to load vote history" },
      { status: 500 }
    );
  }
}
