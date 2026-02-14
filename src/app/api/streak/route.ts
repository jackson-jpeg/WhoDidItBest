import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSessionId } from "@/lib/session";

export async function GET() {
  try {
    const sessionId = await getSessionId();

    // Get distinct days the user voted, ordered most recent first
    const voteDays = await db
      .select({
        day: sql<string>`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`.as("day"),
      })
      .from(votes)
      .where(eq(votes.sessionId, sessionId))
      .groupBy(sql`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(desc(sql`DATE(${votes.createdAt} AT TIME ZONE 'UTC')`));

    if (voteDays.length === 0) {
      return NextResponse.json({ streak: 0, votedToday: false });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const mostRecentDay = voteDays[0].day;
    const votedToday = mostRecentDay === todayStr;

    // Streak must include today or yesterday to be active
    if (mostRecentDay !== todayStr && mostRecentDay !== yesterdayStr) {
      return NextResponse.json({ streak: 0, votedToday: false });
    }

    // Count consecutive days backwards
    let streak = 0;
    let expectedDate = new Date(mostRecentDay + "T00:00:00Z");

    for (const row of voteDays) {
      const rowDate = new Date(row.day + "T00:00:00Z");
      const expectedStr = expectedDate.toISOString().split("T")[0];

      if (row.day === expectedStr) {
        streak++;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({ streak, votedToday });
  } catch (error) {
    console.error("Streak error:", error);
    return NextResponse.json({ streak: 0, votedToday: false });
  }
}
