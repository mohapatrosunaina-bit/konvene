"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Club {
  id: string;
  name: string;
}

export function ClubMarquee() {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    api<Club[]>("/clubs").then(setClubs).catch(() => {});
  }, []);

  if (clubs.length === 0) return null;

  const track = [...clubs, ...clubs, ...clubs, ...clubs];

  return (
    <section className="mb-20">
      <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-inkSoft">
        Clubs already running on Konvene
      </p>
      <div className="overflow-hidden border-y-[1.5px] border-dashed border-ink/40 py-4">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {track.map((c, i) => (
            <span key={i} className="font-display text-xl italic text-inkSoft">
              {c.name}
              <span className="ml-10 not-italic text-signal">●</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
