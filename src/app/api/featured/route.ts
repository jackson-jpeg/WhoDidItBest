import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, options, categories } from "@/lib/db/schema";
import { eq, desc, sql, gt } from "drizzle-orm";

export async function GET() {
  try {
    // Pick the most controversial question with at least some votes
    // "Controversial" = closest to 50/50 split among questions with 2+ votes
    const questionRows = await db
      .select({
        id: questions.id,
        prompt: questions.prompt,
        subtitle: questions.subtitle,
        totalVotes: questions.totalVotes,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(questions.status, "active"))
      .orderBy(desc(questions.totalVotes))
      .limit(50);

    if (questionRows.length === 0) {
      return NextResponse.json({ featured: null });
    }

    // Get options for top questions to compute controversy
    const qIds = questionRows.map((q) => q.id);
    const allOptions = await db
      .select({
        questionId: options.questionId,
        name: options.name,
        voteCount: options.voteCount,
      })
      .from(options)
      .where(
        sql`${options.questionId} IN (${sql.join(
          qIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const optsByQ = new Map<string, typeof allOptions>();
    for (const o of allOptions) {
      const arr = optsByQ.get(o.questionId) ?? [];
      arr.push(o);
      optsByQ.set(o.questionId, arr);
    }

    // Score each question by controversy (closeness to 50/50) * having enough votes
    let bestQ = questionRows[0];
    let bestScore = -1;

    // Use day of year as seed for deterministic daily pick
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    for (const q of questionRows) {
      if (q.totalVotes < 2) continue;
      const opts = optsByQ.get(q.id) ?? [];
      if (opts.length === 0) continue;

      const topVotes = Math.max(...opts.map((o) => o.voteCount));
      const topProportion = topVotes / q.totalVotes;
      // Controversy: 1.0 when 50/50, 0.0 when unanimous
      const controversy = 1 - Math.abs(0.5 - topProportion) * 2;
      // Popularity boost
      const popularity = Math.log(q.totalVotes + 1) / 10;
      // Deterministic daily rotation: hash question index with day
      const rotation = ((qIds.indexOf(q.id) + dayOfYear) % questionRows.length) / questionRows.length * 0.3;

      const score = controversy * 0.5 + popularity * 0.2 + rotation;
      if (score > bestScore) {
        bestScore = score;
        bestQ = q;
      }
    }

    const featuredOpts = (optsByQ.get(bestQ.id) ?? []).sort(
      (a, b) => b.voteCount - a.voteCount
    );
    const winner = featuredOpts[0] ?? null;
    const winnerPct =
      bestQ.totalVotes > 0 && winner
        ? Math.round((winner.voteCount / bestQ.totalVotes) * 100)
        : 0;

    return NextResponse.json({
      featured: {
        id: bestQ.id,
        prompt: bestQ.prompt,
        categoryName: bestQ.categoryName,
        totalVotes: bestQ.totalVotes,
        winnerName: winner?.name ?? null,
        winnerPercentage: winnerPct,
      },
    });
  } catch (error) {
    console.error("Featured error:", error);
    return NextResponse.json({ featured: null });
  }
}
