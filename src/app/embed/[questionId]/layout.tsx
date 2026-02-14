import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Who Did It Best? — Vote",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
