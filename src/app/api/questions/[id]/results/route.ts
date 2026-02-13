import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const questionRows = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (questionRows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionRows[0];

    const questionOptions = await db
      .select()
      .from(options)
      .where(eq(options.questionId, id))
      .orderBy(options.sortOrder);

    const totalVotes = question.totalVotes;
    const maxVotes = Math.max(...questionOptions.map((o) => o.voteCount), 0);

    const results = questionOptions.map((o) => ({
      optionId: o.id,
      name: o.name,
      subtitle: o.subtitle,
      voteCount: o.voteCount,
      percentage:
        totalVotes > 0
          ? Math.round((o.voteCount / totalVotes) * 100)
          : 0,
      isWinner: o.voteCount === maxVotes && o.voteCount > 0,
      isUserVote: false,
    }));

    return NextResponse.json({
      questionId: id,
      prompt: question.prompt,
      totalVotes,
      results,
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load results" },
      { status: 500 }
    );
  }
}
