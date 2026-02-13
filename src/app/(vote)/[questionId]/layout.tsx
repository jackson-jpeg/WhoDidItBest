import type { Metadata } from "next";
import { db } from "@/lib/db";
import { questions, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ questionId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { questionId } = await params;

  const rows = await db
    .select({
      prompt: questions.prompt,
      subtitle: questions.subtitle,
      categoryName: categories.name,
    })
    .from(questions)
    .innerJoin(categories, eq(questions.categoryId, categories.id))
    .where(eq(questions.id, questionId))
    .limit(1);

  if (rows.length === 0) {
    return { title: "Question Not Found — Who Did It Best?" };
  }

  const q = rows[0];
  const title = `${q.prompt} — Who Did It Best?`;
  const description =
    q.subtitle ?? `Cast your vote on this ${q.categoryName} matchup.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og/${questionId}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${questionId}`],
    },
  };
}

export default function QuestionLayout({ children }: Props) {
  return <>{children}</>;
}
