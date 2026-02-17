"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="text-center py-16">
          <p className="font-mono text-6xl font-bold text-arena-red mb-4">
            Oops
          </p>
          <h1 className="text-2xl md:text-3xl mb-3">Something went wrong</h1>
          <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-3 hover:bg-arena-red/90 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </PageContainer>
      <Footer />
    </>
  );
}
