import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, options, questions, categories } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET() {
  try {
    const sessionId = await getSessionId();

    // Total votes
    const voteRows = await db
      .select({
        questionId: votes.questionId,
        optionId: votes.optionId,
      })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));

    const totalVotes = voteRows.length;

    if (totalVotes < 5) {
      return NextResponse.json({
        unlocked: false,
        totalVotes,
        minRequired: 5,
      });
    }

    const questionIds = voteRows.map((v) => v.questionId);

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

    // Agreement rate
    let agreements = 0;
    for (const v of voteRows) {
      if (winnerByQ.get(v.questionId) === v.optionId) {
        agreements++;
      }
    }
    const agreementRate = Math.round((agreements / totalVotes) * 100);

    // Category breakdown
    const catCounts = await db
      .select({
        categoryName: categories.name,
        iconEmoji: categories.iconEmoji,
        count: sql<number>`count(*)`.as("cnt"),
      })
      .from(votes)
      .innerJoin(questions, eq(votes.questionId, questions.id))
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(votes.sessionId, sessionId))
      .groupBy(categories.name, categories.iconEmoji)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Determine personality
    let personality: string;
    let personalityEmoji: string;
    let personalityDesc: string;

    if (agreementRate >= 75) {
      personality = "The Crowd Surfer";
      personalityEmoji = "🏄";
      personalityDesc = "You ride the wave of popular opinion. The people's champion.";
    } else if (agreementRate >= 55) {
      personality = "The Moderate";
      personalityEmoji = "⚖️";
      personalityDesc = "Sometimes with the crowd, sometimes against. Balanced takes.";
    } else if (agreementRate >= 35) {
      personality = "The Contrarian";
      personalityEmoji = "🎭";
      personalityDesc = "You see what others don't. Your hot takes run hot.";
    } else {
      personality = "The Rebel";
      personalityEmoji = "🔥";
      personalityDesc = "You consistently go against the grain. A true original.";
    }

    // Biggest upset: question where user voted for the least popular option
    let biggestUpset = null;
    for (const v of voteRows) {
      const opts = allOptions.filter((o) => o.questionId === v.questionId);
      if (opts.length < 2) continue;
      const totalQ = opts.reduce((sum, o) => sum + o.voteCount, 0);
      if (totalQ < 3) continue;
      const votedOpt = opts.find((o) => o.id === v.optionId);
      if (!votedOpt) continue;
      const pct = Math.round((votedOpt.voteCount / totalQ) * 100);
      if (biggestUpset === null || pct < biggestUpset.percentage) {
        biggestUpset = { questionId: v.questionId, percentage: pct };
      }
    }

    // Fetch the upset question details
    let upsetDetail = null;
    if (biggestUpset && biggestUpset.percentage < 40) {
      const qRow = await db
        .select({ prompt: questions.prompt })
        .from(questions)
        .where(eq(questions.id, biggestUpset.questionId))
        .limit(1);
      if (qRow.length > 0) {
        upsetDetail = {
          prompt: qRow[0].prompt,
          percentage: biggestUpset.percentage,
        };
      }
    }

    return NextResponse.json({
      unlocked: true,
      totalVotes,
      agreementRate,
      personality,
      personalityEmoji,
      personalityDesc,
      topCategories: catCounts.map((c) => ({
        name: c.categoryName,
        emoji: c.iconEmoji,
        count: Number(c.count),
      })),
      biggestUpset: upsetDetail,
    });
  } catch (error) {
    console.error("Recap error:", error);
    return NextResponse.json(
      { error: "Failed to load recap" },
      { status: 500 }
    );
  }
}
