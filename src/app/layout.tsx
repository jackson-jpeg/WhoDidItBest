import type { Metadata } from "next";
import {
  playfairDisplay,
  sourceSerif4,
  barlowCondensed,
  jetbrainsMono,
} from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Who Did It Best?",
  description:
    "Vote on matchups. See the verdict. Settle the debate once and for all.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${sourceSerif4.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
