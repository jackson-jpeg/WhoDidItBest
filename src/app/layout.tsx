import type { Metadata, Viewport } from "next";
import {
  playfairDisplay,
  sourceSerif4,
  barlowCondensed,
  jetbrainsMono,
} from "./fonts";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F0E8",
};

export const metadata: Metadata = {
  title: {
    default: "Who Did It Best?",
    template: "%s | Who Did It Best?",
  },
  description:
    "Vote on matchups. See the verdict. Settle the debate once and for all.",
  metadataBase: new URL("https://who-did-it-best.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "Who Did It Best?",
    title: "Who Did It Best?",
    description:
      "Vote on matchups. See the verdict. Settle the debate once and for all.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Did It Best?",
    description:
      "Vote on matchups. See the verdict. Settle the debate once and for all.",
  },
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
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Who Did It Best?",
              url: "https://who-did-it-best.vercel.app",
              description:
                "Vote on matchups. See the verdict. Settle the debate once and for all.",
              applicationCategory: "Entertainment",
              operatingSystem: "Any",
            }),
          }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
