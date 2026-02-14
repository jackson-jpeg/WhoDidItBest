import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rankings",
  description: "See the hottest, most controversial, and most-voted matchups in the arena.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
