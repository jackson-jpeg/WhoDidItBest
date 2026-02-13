import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, options, questions, impressions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, optionId } = body;

    if (!questionId || !optionId) {
      return NextResponse.json(
        { error: "questionId and optionId are required" },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();

    // Check for duplicate vote by session
    const existingVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.questionId, questionId),
          eq(votes.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existingVote.length > 0) {
      return NextResponse.json(
        { error: "You have already voted on this question" },
        { status: 409 }
      );
    }

    // Verify the option belongs to the question
    const optionRow = await db
      .select()
      .from(options)
      .where(and(eq(options.id, optionId), eq(options.questionId, questionId)))
      .limit(1);

    if (optionRow.length === 0) {
      return NextResponse.json(
        { error: "Invalid option for this question" },
        { status: 400 }
      );
    }

    // Insert vote, increment counts, and record impression atomically
    await db.transaction(async (tx) => {
      await tx.insert(votes).values({
        questionId,
        optionId,
        sessionId,
      });

      await tx
        .update(options)
        .set({ voteCount: sql`${options.voteCount} + 1` })
        .where(eq(options.id, optionId));

      await tx
        .update(questions)
        .set({
          totalVotes: sql`${questions.totalVotes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, questionId));

      // Upsert impression as "voted"
      const existingImpression = await tx
        .select()
        .from(impressions)
        .where(
          and(
            eq(impressions.questionId, questionId),
            eq(impressions.sessionId, sessionId)
          )
        )
        .limit(1);

      if (existingImpression.length === 0) {
        await tx.insert(impressions).values({
          questionId,
          sessionId,
          action: "voted",
        });
      } else {
        await tx
          .update(impressions)
          .set({ action: "voted" })
          .where(
            and(
              eq(impressions.questionId, questionId),
              eq(impressions.sessionId, sessionId)
            )
          );
      }
    });

    // Fetch updated results
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    const questionOptions = await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(options.sortOrder);

    const totalVotes = question[0]?.totalVotes ?? 0;
    const maxVotes = Math.max(...questionOptions.map((o) => o.voteCount));

    const results = questionOptions.map((o) => ({
      optionId: o.id,
      name: o.name,
      subtitle: o.subtitle,
      voteCount: o.voteCount,
      percentage: totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0,
      isWinner: o.voteCount === maxVotes && o.voteCount > 0,
      isUserVote: o.id === optionId,
    }));

    return NextResponse.json({
      questionId,
      prompt: question[0]?.prompt,
      totalVotes,
      results,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}
