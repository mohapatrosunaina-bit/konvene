"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { HowItWorks } from "@/components/HowItWorks";
import { FeatureGrid } from "@/components/FeatureGrid";
import { ClubMarquee } from "@/components/ClubMarquee";
import { Search } from "lucide-react";

interface EventCardData {
  id: string;
  title: string;
  slug: string;
  category: string;
  venue: string;
  startAt: string;
  capacity: number;
  club: { name: string; logoUrl?: string };
  _count: { registrations: number };
}

const CATEGORIES = [
  "WORKSHOP", "HACKATHON", "CONFERENCE", "TALK", "SEMINAR", "SPORTS", "CULTURAL",
  "TECHNICAL", "MUSIC", "DANCE", "FEST", "BOOTCAMP", "PLACEMENT", "COMPETITION",
];

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    api<EventCardData[]>(`/events${params.toString() ? `?${params}` : ""}`)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [category, query]);

  return (
    <div>
      <Hero />
      <ClubMarquee />
      <HowItWorks />

      <section id="events" className="scroll-mt-24">
        <div className="mb-6 flex flex-col gap-4 border-b-[1.5px] border-ink pb-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-3xl font-semibold italic">Happening now</h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkSoft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events…"
              className="w-full border-[1.5px] border-ink bg-paper py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:bg-paperAlt"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`rounded-full border-[1.5px] border-ink px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
              category === "" ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-paperAlt"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border-[1.5px] border-ink px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
                category === c ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-paperAlt"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse border-[1.5px] border-ink bg-paperAlt" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="border-[1.5px] border-dashed border-ink py-20 text-center font-display text-lg italic text-inkSoft">
            No published events match yet — check back soon.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <EventCard
                key={e.id}
                slug={e.slug}
                title={e.title}
                category={e.category}
                clubName={e.club.name}
                startAt={e.startAt}
                venue={e.venue}
                registered={e._count.registrations}
                capacity={e.capacity}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      <FeatureGrid />
    </div>
  );
}
