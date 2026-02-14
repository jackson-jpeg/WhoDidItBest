"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { StreakBadge } from "./StreakBadge";

const navLinks = [
  { href: "/", label: "Vote" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Ranks" },
  { href: "/history", label: "History" },
  { href: "/submit", label: "Submit" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-ink/10">
      <div className="mx-auto max-w-2xl px-4 md:px-6 flex items-center justify-between h-14">
        {/* Logo + streak */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-headline text-lg font-black tracking-tight">
            Who Did It Best<span className="text-arena-red">?</span>
          </Link>
          <StreakBadge />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-ui text-xs uppercase tracking-widest transition-colors pb-0.5 ${
                  active
                    ? "text-arena-red border-b-2 border-arena-red"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-2 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span
              className={`block h-0.5 bg-ink transition-transform ${
                menuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            />
            <span
              className={`block h-0.5 bg-ink transition-opacity ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 bg-ink transition-transform ${
                menuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink/10 bg-cream">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 font-ui text-sm uppercase tracking-widest transition-colors ${
                  active
                    ? "text-arena-red bg-cream-dark"
                    : "text-ink-muted hover:text-ink hover:bg-cream-dark"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
