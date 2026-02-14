import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { arguments_, argumentUpvotes, options } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

const MAX_BODY_LENGTH = 280;

// GET: get arguments for a question
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

    // Get arguments with option name, ordered by upvotes
    const rows = await db
      .select({
        id: arguments_.id,
        optionId: arguments_.optionId,
        optionName: options.name,
        body: arguments_.body,
        upvotes: arguments_.upvotes,
        createdAt: arguments_.createdAt,
        isOwn: sql<boolean>`${arguments_.sessionId} = ${sessionId}`.as(
          "is_own"
        ),
      })
      .from(arguments_)
      .innerJoin(options, eq(arguments_.optionId, options.id))
      .where(eq(arguments_.questionId, questionId))
      .orderBy(desc(arguments_.upvotes), desc(arguments_.createdAt))
      .limit(50);

    // Get which arguments the current user has upvoted
    const argIds = rows.map((r) => r.id);
    let upvotedSet = new Set<string>();

    if (argIds.length > 0) {
      const upvoted = await db
        .select({ argumentId: argumentUpvotes.argumentId })
        .from(argumentUpvotes)
        .where(
          sql`${argumentUpvotes.sessionId} = ${sessionId} AND ${
            argumentUpvotes.argumentId
          } IN (${sql.join(
            argIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      upvotedSet = new Set(upvoted.map((u) => u.argumentId));
    }

    return NextResponse.json({
      arguments: rows.map((r) => ({
        ...r,
        hasUpvoted: upvotedSet.has(r.id),
      })),
    });
  } catch (error) {
    console.error("Arguments GET error:", error);
    return NextResponse.json(
      { error: "Failed to load arguments" },
      { status: 500 }
    );
  }
}

// POST: create an argument or upvote one
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const sessionId = await getSessionId();

    if (action === "upvote") {
      // Toggle upvote on an argument
      const { argumentId } = body;
      if (!argumentId) {
        return NextResponse.json(
          { error: "argumentId required" },
          { status: 400 }
        );
      }

      const existing = await db
        .select()
        .from(argumentUpvotes)
        .where(
          and(
            eq(argumentUpvotes.argumentId, argumentId),
            eq(argumentUpvotes.sessionId, sessionId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Remove upvote
        await db
          .delete(argumentUpvotes)
          .where(
            and(
              eq(argumentUpvotes.argumentId, argumentId),
              eq(argumentUpvotes.sessionId, sessionId)
            )
          );
        await db
          .update(arguments_)
          .set({ upvotes: sql`${arguments_.upvotes} - 1` })
          .where(eq(arguments_.id, argumentId));
      } else {
        // Add upvote
        await db.insert(argumentUpvotes).values({
          argumentId,
          sessionId,
        });
        await db
          .update(arguments_)
          .set({ upvotes: sql`${arguments_.upvotes} + 1` })
          .where(eq(arguments_.id, argumentId));
      }

      return NextResponse.json({ success: true });
    }

    // Default: create argument
    const { questionId, optionId, body: argBody } = body;

    if (!questionId || !optionId || !argBody) {
      return NextResponse.json(
        { error: "questionId, optionId, and body required" },
        { status: 400 }
      );
    }

    if (typeof argBody !== "string" || argBody.trim().length === 0) {
      return NextResponse.json(
        { error: "Argument cannot be empty" },
        { status: 400 }
      );
    }

    if (argBody.length > MAX_BODY_LENGTH) {
      return NextResponse.json(
        { error: `Argument must be ${MAX_BODY_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Check if user already has an argument for this question
    const existing = await db
      .select()
      .from(arguments_)
      .where(
        and(
          eq(arguments_.questionId, questionId),
          eq(arguments_.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing argument
      await db
        .update(arguments_)
        .set({ body: argBody.trim(), optionId })
        .where(
          and(
            eq(arguments_.questionId, questionId),
            eq(arguments_.sessionId, sessionId)
          )
        );
    } else {
      await db.insert(arguments_).values({
        questionId,
        optionId,
        sessionId,
        body: argBody.trim(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Arguments POST error:", error);
    return NextResponse.json(
      { error: "Failed to save argument" },
      { status: 500 }
    );
  }
}
