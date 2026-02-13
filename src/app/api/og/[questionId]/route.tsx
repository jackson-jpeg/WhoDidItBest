import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { questions, options } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;

  const questionRows = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (questionRows.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const question = questionRows[0];

  const questionOptions = await db
    .select()
    .from(options)
    .where(eq(options.questionId, questionId))
    .orderBy(options.sortOrder);

  const totalVotes = question.totalVotes;
  const maxVotes = Math.max(...questionOptions.map((o) => o.voteCount), 0);
  const winner = questionOptions.find((o) => o.voteCount === maxVotes);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F5F0E8",
          padding: "60px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", marginBottom: "20px" }}>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#0D0D0D",
            }}
          >
            Who Did It Best
          </span>
          <span style={{ fontSize: "24px", fontWeight: 900, color: "#E63946" }}>
            ?
          </span>
        </div>

        {/* Question */}
        <h1
          style={{
            fontSize: "52px",
            fontWeight: 900,
            color: "#0D0D0D",
            lineHeight: 1.1,
            marginBottom: "40px",
            maxWidth: "900px",
          }}
        >
          {question.prompt}
        </h1>

        {/* Results */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
          }}
        >
          {questionOptions.slice(0, 4).map((opt) => {
            const pct =
              totalVotes > 0
                ? Math.round((opt.voteCount / totalVotes) * 100)
                : 0;
            const isWinner = opt.id === winner?.id && totalVotes > 0;

            return (
              <div
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: isWinner ? "#E63946" : "#0D0D0D",
                    width: "300px",
                  }}
                >
                  {opt.name}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "24px",
                    backgroundColor: "#E8E0D0",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      backgroundColor: isWinner ? "#E63946" : "#2A2A2A",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: isWinner ? "#E63946" : "#4A4A4A",
                    width: "80px",
                    textAlign: "right",
                  }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(13,13,13,0.15)",
            paddingTop: "20px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              color: "#8A8A8A",
              fontFamily: "monospace",
            }}
          >
            {totalVotes.toLocaleString()} votes
          </span>
          <span
            style={{
              fontSize: "16px",
              color: "#8A8A8A",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Cast your vote &rarr;
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
