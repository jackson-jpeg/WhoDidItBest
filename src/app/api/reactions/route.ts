import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSessionId } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

const VALID_EMOJIS = ["fire", "shocked", "fair", "wrong"];

// GET: get reaction counts for a question
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    const sessionId = await getSessionId();

    // Get counts per emoji
    const counts = await db
      .select({
        emoji: reactions.emoji,
        count: sql<number>`count(*)`.as("cnt"),
      })
      .from(reactions)
      .where(eq(reactions.questionId, questionId))
      .groupBy(reactions.emoji);

    // Get user's reaction
    const userReaction = await db
      .select({ emoji: reactions.emoji })
      .from(reactions)
      .where(
        and(
          eq(reactions.questionId, questionId),
          eq(reactions.sessionId, sessionId)
        )
      )
      .limit(1);

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.emoji] = Number(c.count);
    }

    return NextResponse.json({
      counts: countMap,
      userReaction: userReaction[0]?.emoji ?? null,
    });
  } catch (error) {
    console.error("Reactions GET error:", error);
    return NextResponse.json({ error: "Failed to load reactions" }, { status: 500 });
  }
}

// POST: add or update a reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, emoji } = body;

    if (!questionId || !emoji) {
      return NextResponse.json(
        { error: "questionId and emoji required" },
        { status: 400 }
      );
    }

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: "Invalid emoji" },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();

    const { allowed } = rateLimit(`reaction:${sessionId}`, 60, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Upsert: update if exists, insert if not
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.questionId, questionId),
          eq(reactions.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].emoji === emoji) {
        // Same reaction — remove it (toggle off)
        await db
          .delete(reactions)
          .where(
            and(
              eq(reactions.questionId, questionId),
              eq(reactions.sessionId, sessionId)
            )
          );
      } else {
        // Different reaction — update
        await db
          .update(reactions)
          .set({ emoji })
          .where(
            and(
              eq(reactions.questionId, questionId),
              eq(reactions.sessionId, sessionId)
            )
          );
      }
    } else {
      await db.insert(reactions).values({
        questionId,
        sessionId,
        emoji,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reactions POST error:", error);
    return NextResponse.json(
      { error: "Failed to save reaction" },
      { status: 500 }
    );
  }
}
