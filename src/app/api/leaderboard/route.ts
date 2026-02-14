import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories, votes } from "@/lib/db/schema";
import { eq, sql, gte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "hot";

    if (tab === "hot") {
      // Hottest right now: most votes in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const hotRows = await db
        .select({
          questionId: votes.questionId,
          recentVotes: sql<number>`count(*)`.as("recent_votes"),
        })
        .from(votes)
        .where(gte(votes.createdAt, oneDayAgo))
        .groupBy(votes.questionId)
        .orderBy(desc(sql`count(*)`))
        .limit(20);

      if (hotRows.length === 0) {
        // Fallback to most-voted overall
        return getTopVoted();
      }

      const ids = hotRows.map((r) => r.questionId);
      const qs = await getQuestionsWithOptions(ids);
      const recentMap = new Map(hotRows.map((r) => [r.questionId, r.recentVotes]));

      const result = qs
        .map((q) => ({ ...q, recentVotes: recentMap.get(q.id) ?? 0 }))
        .sort((a, b) => b.recentVotes - a.recentVotes);

      return NextResponse.json({ questions: result });
    }

    if (tab === "controversial") {
      // Most controversial: closest to 50/50 split, min 5 votes
      const allQs = await db
        .select({
          id: questions.id,
          prompt: questions.prompt,
          subtitle: questions.subtitle,
          categoryName: categories.name,
          categorySlug: categories.slug,
          totalVotes: questions.totalVotes,
          tags: questions.tags,
        })
        .from(questions)
        .innerJoin(categories, eq(questions.categoryId, categories.id))
        .where(
          sql`${questions.status} = 'active' AND ${questions.totalVotes} >= 5`
        )
        .orderBy(desc(questions.totalVotes));

      const qIds = allQs.map((q) => q.id);
      if (qIds.length === 0) {
        return NextResponse.json({ questions: [] });
      }

      const allOptions = await db
        .select({
          id: options.id,
          questionId: options.questionId,
          name: options.name,
          subtitle: options.subtitle,
          sortOrder: options.sortOrder,
          voteCount: options.voteCount,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            qIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      const optByQ = new Map<string, typeof allOptions>();
      for (const o of allOptions) {
        const arr = optByQ.get(o.questionId) ?? [];
        arr.push(o);
        optByQ.set(o.questionId, arr);
      }

      // Score controversy: 1 = perfect 50/50, 0 = complete blowout
      const scored = allQs.map((q) => {
        const opts = (optByQ.get(q.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
        const topVotes = opts.length > 0 ? Math.max(...opts.map((o) => o.voteCount)) : 0;
        const topProportion = q.totalVotes > 0 ? topVotes / q.totalVotes : 1;
        const controversy = 1 - Math.abs(0.5 - topProportion) * 2;
        return { ...q, options: opts, controversy };
      });

      scored.sort((a, b) => b.controversy - a.controversy);

      return NextResponse.json({ questions: scored.slice(0, 20) });
    }

    if (tab === "most-voted") {
      return getTopVoted();
    }

    if (tab === "newest") {
      const qs = await db
        .select({
          id: questions.id,
          prompt: questions.prompt,
          subtitle: questions.subtitle,
          categoryName: categories.name,
          categorySlug: categories.slug,
          totalVotes: questions.totalVotes,
          tags: questions.tags,
        })
        .from(questions)
        .innerJoin(categories, eq(questions.categoryId, categories.id))
        .where(eq(questions.status, "active"))
        .orderBy(desc(questions.createdAt))
        .limit(20);

      const ids = qs.map((q) => q.id);
      const opts = ids.length > 0 ? await getOptions(ids) : new Map<string, OptionRow[]>();

      return NextResponse.json({
        questions: qs.map((q) => ({
          ...q,
          options: (opts.get(q.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
        })),
      });
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}

async function getTopVoted() {
  const qs = await db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      subtitle: questions.subtitle,
      categoryName: categories.name,
      categorySlug: categories.slug,
      totalVotes: questions.totalVotes,
      tags: questions.tags,
    })
    .from(questions)
    .innerJoin(categories, eq(questions.categoryId, categories.id))
    .where(eq(questions.status, "active"))
    .orderBy(desc(questions.totalVotes))
    .limit(20);

  const ids = qs.map((q) => q.id);
  const opts = ids.length > 0 ? await getOptions(ids) : new Map<string, OptionRow[]>();

  return NextResponse.json({
    questions: qs.map((q) => ({
      ...q,
      options: (opts.get(q.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    })),
  });
}

type OptionRow = {
  id: string;
  questionId: string;
  name: string;
  subtitle: string | null;
  sortOrder: number;
  voteCount: number;
};

async function getOptions(ids: string[]) {
  const allOptions = await db
    .select({
      id: options.id,
      questionId: options.questionId,
      name: options.name,
      subtitle: options.subtitle,
      sortOrder: options.sortOrder,
      voteCount: options.voteCount,
    })
    .from(options)
    .where(
      sql`${options.questionId} IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const map = new Map<string, OptionRow[]>();
  for (const o of allOptions) {
    const arr = map.get(o.questionId) ?? [];
    arr.push(o);
    map.set(o.questionId, arr);
  }
  return map;
}

async function getQuestionsWithOptions(ids: string[]) {
  const qs = await db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      subtitle: questions.subtitle,
      categoryName: categories.name,
      categorySlug: categories.slug,
      totalVotes: questions.totalVotes,
      tags: questions.tags,
    })
    .from(questions)
    .innerJoin(categories, eq(questions.categoryId, categories.id))
    .where(
      sql`${questions.id} IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const opts = await getOptions(ids);

  return qs.map((q) => ({
    ...q,
    options: (opts.get(q.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
