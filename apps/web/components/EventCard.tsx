"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { categoryStyle } from "@/lib/utils";

const MotionLink = motion.create(Link);

interface EventCardProps {
  slug: string;
  title: string;
  category: string;
  clubName: string;
  startAt: string;
  venue: string;
  registered: number;
  capacity: number;
  index?: number;
}

export function EventCard({ slug, title, category, clubName, startAt, venue, registered, capacity, index = 0 }: EventCardProps) {
  const full = registered >= capacity;
  const { bg } = categoryStyle(category);

  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 250, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 250, damping: 20 });

  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      style={{ perspective: 800 }}
    >
      <MotionLink
        href={`/events/${slug}`}
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="card card-hover block overflow-hidden"
      >
        <div className="relative h-28 w-full border-b-[1.5px] border-ink" style={{ backgroundColor: bg }}>
          <div className="absolute inset-0 bg-dot-grid bg-dots opacity-20 mix-blend-overlay" />
          <span
            className="absolute left-3 top-3 rounded-full border-[1.5px] border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: "#F6F1E7", color: "#15130F" }}
          >
            {category}
          </span>
          {full && (
            <span className="absolute right-3 top-3 rounded-full border-[1.5px] border-ink bg-acid px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-ink">
              Waitlist
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold leading-snug text-ink">{title}</h3>
          <p className="mt-1 text-sm text-inkSoft">{clubName}</p>

          <div className="mt-4 space-y-1.5 text-sm text-inkSoft">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{new Date(startAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{venue}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-[1.5px] border-dashed border-ink/30 pt-3">
            <div className="flex items-center gap-1.5 font-mono text-xs text-inkSoft">
              <Users className="h-3.5 w-3.5" />
              {registered}/{capacity}
            </div>
            <div className="h-2 w-24 overflow-hidden rounded-full border-[1.5px] border-ink bg-paperAlt">
              <div
                className="h-full"
                style={{ width: `${Math.min((registered / capacity) * 100, 100)}%`, backgroundColor: bg }}
              />
            </div>
          </div>
        </div>
      </MotionLink>
    </motion.div>
  );
}
