import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Vote" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/submit", label: "Submit" },
  { href: "/history", label: "History" },
  { href: "/recap", label: "Your Verdict" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-16">
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-8">
        {/* Masthead */}
        <div className="text-center mb-6">
          <p className="font-headline text-lg font-black tracking-tight">
            Who Did It Best<span className="text-arena-red">?</span>
          </p>
          <p className="font-body text-sm text-ink-muted mt-1">
            A crowdsourced opinion engine disguised as a game.
          </p>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-ui text-[10px] uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-ink/10 pt-4">
          <p className="font-ui text-[10px] text-ink-light text-center tracking-wider">
            &copy; {new Date().getFullYear()} Who Did It Best? &mdash; Settle
            the debate once and for all.
          </p>
        </div>
      </div>
    </footer>
  );
}
