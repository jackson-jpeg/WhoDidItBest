import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vote History",
  description: "See all the matchups you've voted on and how your picks compare to the crowd.",
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
