"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function NavBar() {
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setClubMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const clubMemberships = user?.clubMemberships ?? [];

  const links = [
    { href: "/", label: "Discover" },
    ...(user ? [{ href: "/tickets", label: "Tickets" }, { href: "/faculty", label: "Faculty" }] : []),
    ...(hasRole("ADMIN") ? [{ href: "/admin/clubs/new", label: "New Club" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 rotate-[-6deg] items-center justify-center rounded-full border-[1.5px] border-ink bg-signal font-display text-sm font-semibold text-paper transition-transform group-hover:rotate-0">
            K
          </span>
          <span className="font-display text-xl font-semibold italic tracking-tight">Konvene</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative py-1 transition-colors",
                pathname === l.href ? "text-ink" : "text-inkSoft hover:text-ink"
              )}
            >
              {l.label}
              {pathname === l.href && <span className="absolute -bottom-[17px] left-0 right-0 h-[3px] bg-signal" />}
            </Link>
          ))}

          {clubMemberships.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setClubMenuOpen((v) => !v)}
                className="flex items-center gap-1 py-1 text-inkSoft transition-colors hover:text-ink"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> My Clubs <ChevronDown className="h-3 w-3" />
              </button>
              {clubMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 border-[1.5px] border-ink bg-paper shadow-hard-sm">
                  {clubMemberships.map((m) => (
                    <Link
                      key={m.club.slug}
                      href={`/club/${m.club.slug}/dashboard`}
                      onClick={() => setClubMenuOpen(false)}
                      className="block border-b border-dashed border-ink/20 px-4 py-2.5 text-sm last:border-0 hover:bg-paperAlt"
                    >
                      <div className="font-semibold">{m.club.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">{m.role.replace("_", " ")}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden font-medium text-inkSoft sm:inline">{user.name}</span>
              <button onClick={logout} className="btn-outline rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-inkSoft hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="btn-signal rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
