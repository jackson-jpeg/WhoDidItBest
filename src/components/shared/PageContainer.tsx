export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 pt-20 pb-8">
      {children}
    </main>
  );
}
