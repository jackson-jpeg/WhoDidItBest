export function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-16 py-6">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <p className="font-ui text-xs text-ink-light text-center">
          &copy; {new Date().getFullYear()} Who Did It Best? &mdash; Settle the debate.
        </p>
      </div>
    </footer>
  );
}
