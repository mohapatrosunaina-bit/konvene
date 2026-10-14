"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="mt-24 border-t-[1.5px] border-ink">
      <div className="overflow-hidden border-b-[1.5px] border-ink bg-ink py-2.5">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] text-paper">
              Konvene <span className="text-acid">✦</span> Campus Events OS <span className="text-signal">✦</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 rotate-[-6deg] items-center justify-center rounded-full border-[1.5px] border-ink bg-signal font-display text-xs font-semibold text-paper">
                K
              </span>
              <span className="font-display text-lg font-semibold italic">Konvene</span>
            </div>
            <p className="max-w-xs text-sm text-inkSoft">
              The operating system for campus communities. Built to replace WhatsApp, Google Forms, and a
              clipboard sign-in sheet with something that actually holds up.
            </p>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wide text-inkSoft">Product</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-signal">Discover events</Link></li>
              {user ? (
                <>
                  <li><Link href="/tickets" className="hover:text-signal">My tickets</Link></li>
                  <li><Link href="/faculty" className="hover:text-signal">Faculty dashboard</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/signup" className="hover:text-signal">Create account</Link></li>
                  <li><Link href="/login" className="hover:text-signal">Log in</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wide text-inkSoft">Built on</p>
            <ul className="space-y-2 text-sm text-inkSoft">
              <li>Next.js 15 + React 19</li>
              <li>Express + Prisma + Postgres</li>
              <li>Supabase Auth &amp; Storage</li>
              <li>HMAC-signed QR tickets</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t-[1.5px] border-dashed border-ink/30 pt-6 text-xs text-inkSoft sm:flex-row">
          <span>© 2026 Konvene. Not a college project.</span>
          <span className="font-mono uppercase tracking-widest">Every ticket is real. Every scan is checked.</span>
        </div>
      </div>
    </footer>
  );
}
