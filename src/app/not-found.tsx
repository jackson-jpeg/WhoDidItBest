import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="text-center py-16">
          <p className="font-mono text-6xl font-bold text-arena-red mb-4">
            404
          </p>
          <h1 className="text-2xl md:text-3xl mb-3">
            This matchup doesn&apos;t exist
          </h1>
          <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto">
            The question you&apos;re looking for might have been removed, or
            maybe it never existed. But there are plenty of debates waiting for
            your vote.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/"
              className="font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-3 hover:bg-arena-red/90 transition-colors"
            >
              Start Voting
            </Link>
            <Link
              href="/explore"
              className="font-ui text-sm uppercase tracking-wide border border-ink/15 text-ink px-6 py-3 hover:bg-ink/[0.03] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/submit"
              className="font-ui text-xs uppercase tracking-widest text-ink-muted hover:text-arena-red transition-colors underline underline-offset-4"
            >
              Submit a question
            </Link>
          </div>
        </div>
      </PageContainer>
      <Footer />
    </>
  );
}
