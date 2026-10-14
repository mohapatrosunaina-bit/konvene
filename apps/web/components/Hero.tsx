"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StickerCluster } from "./StickerCluster";

interface Stats {
  clubs: number;
  publishedEvents: number;
  registrations: number;
  certificates: number;
}

const TICKER_WORDS = [
  "HACKATHONS", "WORKSHOPS", "FESTS", "CONFERENCES", "COMPETITIONS", "BOOTCAMPS", "TALKS", "PLACEMENTS",
];

export function Hero() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/stats").then(setStats).catch(() => {});
  }, []);

  const firstClub = user?.clubMemberships?.[0]?.club;
  const secondaryHref = firstClub ? `/club/${firstClub.slug}/dashboard` : "/tickets";
  const secondaryLabel = firstClub ? `${firstClub.name} dashboard` : "My tickets";

  const statItems = stats
    ? [
        { label: "Clubs live", value: stats.clubs },
        { label: "Events running", value: stats.publishedEvents },
        { label: "Registrations", value: stats.registrations },
        { label: "Certificates issued", value: stats.certificates },
      ]
    : [];

  return (
    <section className="relative mb-16">
      <StickerCluster />
      {/* Marquee ticker */}
      <div className="mb-10 overflow-hidden border-y-[1.5px] border-ink bg-ink py-2.5">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {[...TICKER_WORDS, ...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
            <span key={i} className="flex items-center gap-8 font-mono text-xs font-medium uppercase tracking-[0.2em] text-paper">
              {w} <span className="text-signal">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative px-2 text-center sm:px-0">
        <motion.div
          initial={{ opacity: 0, rotate: -8, scale: 0.8 }}
          animate={{ opacity: 1, rotate: -6, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="stamp mx-auto mb-6 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-acid px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink"
        >
          {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Not another event app"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-4xl text-[2.75rem] font-medium leading-[1.02] tracking-tight sm:text-7xl"
        >
          {user ? (
            <>
              What's happening
              <br />
              on <span className="relative inline-block italic text-signal">campus.</span>
            </>
          ) : (
            <>
              Campus events,
              <br />
              run like a{" "}
              <span className="relative inline-block italic text-signal">
                real product.
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0,8 Q50,0 100,8 T200,8" stroke="#15130F" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-base text-inkSoft sm:text-lg"
        >
          {user
            ? "Register for what's live right now, or jump back into what you're already part of."
            : "Registration, QR check-in, and faculty-verified attendance — replacing WhatsApp threads, Google Forms, and a clipboard sign-in sheet."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-9 flex items-center justify-center gap-4"
        >
          <a href="#events" className="btn-signal rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide">
            Explore events
          </a>
          <Link href={user ? secondaryHref : "/signup"} className="btn-outline rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide">
            {user ? secondaryLabel : "Create account"}
          </Link>
        </motion.div>

        {statItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-2 border-[1.5px] border-ink sm:grid-cols-4"
          >
            {statItems.map((s, i) => (
              <div
                key={s.label}
                className={`px-4 py-6 ${i % 2 === 0 ? "bg-paper" : "bg-paperAlt"} ${i > 0 ? "border-l-[1.5px] border-ink" : ""} ${i >= 2 ? "border-t-[1.5px] sm:border-t-0" : ""}`}
              >
                <div className="font-display text-3xl font-semibold sm:text-4xl">{s.value}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-inkSoft">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
