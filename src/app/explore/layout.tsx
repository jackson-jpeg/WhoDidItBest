import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse categories, trending matchups, and rankings. Find your next debate.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
