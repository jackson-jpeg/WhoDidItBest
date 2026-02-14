import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Pulse",
  description: "Live stats from the arena. Total votes, trending questions, and category breakdowns.",
};

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
