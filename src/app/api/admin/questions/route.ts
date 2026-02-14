import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  return key === adminKey;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? "draft";

  const rows = await db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      subtitle: questions.subtitle,
      status: questions.status,
      totalVotes: questions.totalVotes,
      categoryName: categories.name,
      categoryEmoji: categories.iconEmoji,
      metadata: questions.metadata,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .innerJoin(categories, eq(questions.categoryId, categories.id))
    .where(eq(questions.status, status as "active" | "draft" | "archived"))
    .orderBy(desc(questions.createdAt))
    .limit(50);

  // Get options for each question
  const qIds = rows.map((r) => r.id);
  const allOptions =
    qIds.length > 0
      ? await db
          .select({
            questionId: options.questionId,
            name: options.name,
            sortOrder: options.sortOrder,
          })
          .from(options)
          .where(
            sql`${options.questionId} IN (${sql.join(
              qIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
      : [];

  const optsByQ = new Map<string, string[]>();
  for (const o of allOptions) {
    const arr = optsByQ.get(o.questionId) ?? [];
    arr.push(o.name);
    optsByQ.set(o.questionId, arr);
  }

  return NextResponse.json({
    questions: rows.map((r) => ({
      ...r,
      options: optsByQ.get(r.id) ?? [],
    })),
  });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { questionId, action } = body as {
    questionId: string;
    action: "approve" | "reject" | "archive";
  };

  if (!questionId || !action) {
    return NextResponse.json(
      { error: "questionId and action required" },
      { status: 400 }
    );
  }

  const newStatus =
    action === "approve" ? "active" : action === "reject" ? "archived" : "archived";

  await db
    .update(questions)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(questions.id, questionId));

  return NextResponse.json({ success: true, newStatus });
}
