import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Question of the Day",
  description: "Today's featured matchup. Cast your vote on the question everyone is talking about.",
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
