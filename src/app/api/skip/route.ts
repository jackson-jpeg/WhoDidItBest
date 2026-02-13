import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { impressions } from "@/lib/db/schema";
import { getSessionId } from "@/lib/session";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();

    // Upsert impression as "skipped"
    const existing = await db
      .select()
      .from(impressions)
      .where(
        and(
          eq(impressions.questionId, questionId),
          eq(impressions.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(impressions).values({
        questionId,
        sessionId,
        action: "skipped",
      });
    } else {
      await db
        .update(impressions)
        .set({ action: "skipped" })
        .where(
          and(
            eq(impressions.questionId, questionId),
            eq(impressions.sessionId, sessionId)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Skip error:", error);
    return NextResponse.json(
      { error: "Failed to skip question" },
      { status: 500 }
    );
  }
}
