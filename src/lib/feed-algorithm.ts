interface FeedQuestionInput {
  id: string;
  createdAt: Date;
  totalVotes: number;
  categoryId: string;
  options: { voteCount: number }[];
}

interface FeedOptions {
  categoryAffinities?: Record<string, number>;
  maxVotesInDataset?: number;
}

function computeFreshness(createdAt: Date): number {
  const hoursAgo =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 24) return 1.0;

  const daysAgo = hoursAgo / 24;
  // Logarithmic decay: 1.0 at day 1, ~0.1 at day 30
  return Math.max(0.1, 1.0 - Math.log(daysAgo) / Math.log(30) * 0.9);
}

function computeCategoryAffinity(
  categoryId: string,
  affinities?: Record<string, number>
): number {
  if (!affinities) return 0.5;
  return affinities[categoryId] ?? 0.5;
}

function computePopularity(
  totalVotes: number,
  maxVotes: number
): number {
  if (maxVotes <= 0) return 0;
  return Math.log(totalVotes + 1) / Math.log(maxVotes + 1);
}

function computeControversy(
  options: { voteCount: number }[],
  totalVotes: number
): number {
  if (totalVotes === 0 || options.length === 0) return 0.5;

  const topVoteCount = Math.max(...options.map((o) => o.voteCount));
  const topProportion = topVoteCount / totalVotes;

  // 1.0 when perfectly split, 0.0 when unanimous
  return 1 - Math.abs(0.5 - topProportion) * 2;
}

export function scoreFeedQuestion(
  question: FeedQuestionInput,
  opts: FeedOptions = {}
): number {
  const freshness = computeFreshness(question.createdAt);
  const affinity = computeCategoryAffinity(
    question.categoryId,
    opts.categoryAffinities
  );
  const popularity = computePopularity(
    question.totalVotes,
    opts.maxVotesInDataset ?? 100
  );
  const controversy = computeControversy(
    question.options,
    question.totalVotes
  );
  const random = Math.random();

  return (
    freshness * 0.25 +
    affinity * 0.3 +
    popularity * 0.15 +
    controversy * 0.2 +
    random * 0.1
  );
}

export function rankFeedQuestions<
  T extends FeedQuestionInput
>(questions: T[], opts: FeedOptions = {}): T[] {
  const scored = questions.map((q) => ({
    question: q,
    score: scoreFeedQuestion(q, opts),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.question);
}
