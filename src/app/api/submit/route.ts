import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionId } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, subtitle, categorySlug, optionNames } = body as {
      prompt: string;
      subtitle?: string;
      categorySlug: string;
      optionNames: string[];
    };

    if (!prompt || !categorySlug || !optionNames || optionNames.length < 2) {
      return NextResponse.json(
        { error: "prompt, categorySlug, and at least 2 optionNames are required" },
        { status: 400 }
      );
    }

    if (optionNames.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 options allowed" },
        { status: 400 }
      );
    }

    if (prompt.length > 200) {
      return NextResponse.json(
        { error: "Prompt must be 200 characters or less" },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();

    // Rate limit: 5 submissions per hour per session
    const { allowed } = rateLimit(`submit:${sessionId}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Try again in an hour." },
        { status: 429 }
      );
    }

    // Verify category exists
    const categoryRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (categoryRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const categoryId = categoryRows[0].id;

    // Insert question as draft (needs approval before going live)
    const [insertedQuestion] = await db
      .insert(questions)
      .values({
        categoryId,
        prompt: prompt.trim(),
        subtitle: subtitle?.trim() || null,
        status: "draft",
        metadata: { submittedBy: sessionId },
      })
      .returning({ id: questions.id });

    // Insert options
    const optionValues = optionNames
      .filter((name: string) => name.trim().length > 0)
      .map((name: string, idx: number) => ({
        questionId: insertedQuestion.id,
        name: name.trim(),
        sortOrder: idx,
      }));

    await db.insert(options).values(optionValues);

    return NextResponse.json({
      success: true,
      questionId: insertedQuestion.id,
      message: "Question submitted! It will appear after review.",
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit question" },
      { status: 500 }
    );
  }
}
