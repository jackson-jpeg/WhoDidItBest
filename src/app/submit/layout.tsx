import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Question",
  description: "Got a debate that needs settling? Submit your matchup and let the crowd decide.",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
