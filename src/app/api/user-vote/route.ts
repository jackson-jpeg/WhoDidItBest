import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId required" },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();

    const userVote = await db
      .select({ optionId: votes.optionId })
      .from(votes)
      .where(
        and(
          eq(votes.questionId, questionId),
          eq(votes.sessionId, sessionId)
        )
      )
      .limit(1);

    if (userVote.length === 0) {
      return NextResponse.json({ optionId: null });
    }

    return NextResponse.json({ optionId: userVote[0].optionId });
  } catch (error) {
    console.error("User vote error:", error);
    return NextResponse.json({ optionId: null });
  }
}
