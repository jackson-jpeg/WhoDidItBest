import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, impressions, questions, categories, options } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: string;
}

export async function GET() {
  try {
    const sessionId = await getSessionId();

    // Get total votes
    const voteRows = await db
      .select({ count: sql<number>`count(*)`.as("cnt") })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));
    const totalVotes = Number(voteRows[0]?.count ?? 0);

    // Get distinct categories voted in
    const categoryRows = await db
      .select({
        categoryId: questions.categoryId,
      })
      .from(votes)
      .innerJoin(questions, eq(votes.questionId, questions.id))
      .where(eq(votes.sessionId, sessionId))
      .groupBy(questions.categoryId);
    const categoriesVoted = categoryRows.length;

    // Get total category count
    const totalCategories = await db
      .select({ count: sql<number>`count(*)`.as("cnt") })
      .from(categories);
    const totalCatCount = Number(totalCategories[0]?.count ?? 0);

    // Get streak (distinct days)
    const voteDays = await db
      .select({
        day: sql<string>`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`.as("day"),
      })
      .from(votes)
      .where(eq(votes.sessionId, sessionId))
      .groupBy(sql`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(desc(sql`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`));

    // Calculate current streak
    let streak = 0;
    if (voteDays.length > 0) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const mostRecent = voteDays[0].day;

      if (mostRecent === todayStr || mostRecent === yesterdayStr) {
        let expected = new Date(mostRecent + "T00:00:00Z");
        for (const row of voteDays) {
          if (row.day === expected.toISOString().split("T")[0]) {
            streak++;
            expected.setUTCDate(expected.getUTCDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Get votes in a single day (max)
    const dailyVotes = await db
      .select({
        day: sql<string>`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`.as("day"),
        count: sql<number>`count(*)`.as("cnt"),
      })
      .from(votes)
      .where(eq(votes.sessionId, sessionId))
      .groupBy(sql`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    const maxDailyVotes = Number(dailyVotes[0]?.count ?? 0);

    // Get skips count
    const skipRows = await db
      .select({ count: sql<number>`count(*)`.as("cnt") })
      .from(impressions)
      .where(
        sql`${impressions.sessionId} = ${sessionId} AND ${impressions.action} = 'skipped'`
      );
    const skipsCount = Number(skipRows[0]?.count ?? 0);

    // Get contrarian count (times user voted for the losing option)
    const userVotes = await db
      .select({
        questionId: votes.questionId,
        optionId: votes.optionId,
      })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));

    let contrarianCount = 0;
    if (userVotes.length > 0) {
      const qIds = [...new Set(userVotes.map((v) => v.questionId))];
      const qOptions = await db
        .select({
          id: options.id,
          questionId: options.questionId,
          voteCount: options.voteCount,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            qIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      const winnerByQ = new Map<string, string>();
      const optsByQ = new Map<string, typeof qOptions>();
      for (const o of qOptions) {
        const arr = optsByQ.get(o.questionId) ?? [];
        arr.push(o);
        optsByQ.set(o.questionId, arr);
      }
      for (const [qId, opts] of optsByQ) {
        const winner = opts.reduce((a, b) => (a.voteCount > b.voteCount ? a : b));
        winnerByQ.set(qId, winner.id);
      }
      for (const v of userVotes) {
        if (winnerByQ.get(v.questionId) !== v.optionId) {
          contrarianCount++;
        }
      }
    }

    const achievements: Achievement[] = [
      {
        id: "first-vote",
        name: "First Vote",
        description: "Cast your first vote",
        emoji: "🗳️",
        unlocked: totalVotes >= 1,
      },
      {
        id: "ten-votes",
        name: "Regular",
        description: "Cast 10 votes",
        emoji: "🔟",
        unlocked: totalVotes >= 10,
        progress: totalVotes < 10 ? `${totalVotes}/10` : undefined,
      },
      {
        id: "fifty-votes",
        name: "Dedicated Voter",
        description: "Cast 50 votes",
        emoji: "⭐",
        unlocked: totalVotes >= 50,
        progress: totalVotes < 50 ? `${totalVotes}/50` : undefined,
      },
      {
        id: "hundred-votes",
        name: "Centurion",
        description: "Cast 100 votes",
        emoji: "💯",
        unlocked: totalVotes >= 100,
        progress: totalVotes < 100 ? `${totalVotes}/100` : undefined,
      },
      {
        id: "speed-voter",
        name: "Speed Voter",
        description: "Cast 10 votes in a single day",
        emoji: "⚡",
        unlocked: maxDailyVotes >= 10,
        progress: maxDailyVotes < 10 ? `Best: ${maxDailyVotes}/10` : undefined,
      },
      {
        id: "explorer",
        name: "Explorer",
        description: "Vote in every category",
        emoji: "🧭",
        unlocked: categoriesVoted >= totalCatCount && totalCatCount > 0,
        progress:
          categoriesVoted < totalCatCount
            ? `${categoriesVoted}/${totalCatCount}`
            : undefined,
      },
      {
        id: "streak-3",
        name: "On a Roll",
        description: "3-day voting streak",
        emoji: "🔥",
        unlocked: streak >= 3,
        progress: streak < 3 ? `${streak}/3 days` : undefined,
      },
      {
        id: "streak-7",
        name: "Streak Master",
        description: "7-day voting streak",
        emoji: "🏆",
        unlocked: streak >= 7,
        progress: streak < 7 ? `${streak}/7 days` : undefined,
      },
      {
        id: "contrarian-5",
        name: "Contrarian",
        description: "Disagree with the majority 5 times",
        emoji: "🤷",
        unlocked: contrarianCount >= 5,
        progress: contrarianCount < 5 ? `${contrarianCount}/5` : undefined,
      },
      {
        id: "contrarian-20",
        name: "Rebel",
        description: "Disagree with the majority 20 times",
        emoji: "✊",
        unlocked: contrarianCount >= 20,
        progress: contrarianCount < 20 ? `${contrarianCount}/20` : undefined,
      },
      {
        id: "skip-master",
        name: "Picky Voter",
        description: "Skip 10 questions",
        emoji: "🙅",
        unlocked: skipsCount >= 10,
        progress: skipsCount < 10 ? `${skipsCount}/10` : undefined,
      },
    ];

    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return NextResponse.json({
      achievements,
      unlockedCount,
      totalCount: achievements.length,
    });
  } catch (error) {
    console.error("Achievements error:", error);
    return NextResponse.json(
      { error: "Failed to load achievements" },
      { status: 500 }
    );
  }
}
