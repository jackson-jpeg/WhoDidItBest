import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Voting Personality",
  description: "Discover your voting personality based on how you've cast your votes in the arena.",
};

export default function RecapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
