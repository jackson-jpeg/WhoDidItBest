export interface VoteOption {
  id: string;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface VotePrompt {
  id: string;
  prompt: string;
  subtitle?: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  tags?: string[] | null;
  options: VoteOption[];
  totalVotes: number;
}

export interface VoteResult {
  optionId: string;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  voteCount: number;
  percentage: number;
  isWinner: boolean;
  isUserVote: boolean;
}

export interface VoteResults {
  questionId: string;
  prompt: string;
  totalVotes: number;
  results: VoteResult[];
}

export type VoteCardState = "idle" | "voting" | "revealing" | "revealed";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconEmoji?: string | null;
  questionCount: number;
}

export interface FeedQuestion extends VotePrompt {
  score?: number;
}
