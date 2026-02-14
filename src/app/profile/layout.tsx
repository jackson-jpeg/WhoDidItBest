import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Arena",
  description: "Your voting stats, achievements, and personality in the arena.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
