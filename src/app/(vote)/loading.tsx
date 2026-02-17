import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";
import { VoteCardSkeleton } from "@/components/vote/VoteCardSkeleton";

export default function VoteLoading() {
  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-8 text-center">
          <div className="h-10 w-48 bg-cream-dark mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-cream-dark mx-auto animate-pulse" />
        </div>
        <VoteCardSkeleton />
      </PageContainer>
      <Footer />
    </>
  );
}
