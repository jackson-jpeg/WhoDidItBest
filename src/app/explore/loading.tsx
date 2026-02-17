import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PageContainer } from "@/components/shared/PageContainer";

export default function ExploreLoading() {
  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-10 animate-pulse">
          <div className="h-10 w-32 bg-cream-dark mb-2" />
          <div className="h-5 w-80 bg-cream-dark" />
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-cream-dark" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-cream-dark" />
            ))}
          </div>
        </div>
      </PageContainer>
      <Footer />
    </>
  );
}
