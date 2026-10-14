"use client";

import { motion } from "framer-motion";

const STICKERS = [
  { text: "QR VERIFIED ✓", bg: "#1F32E0", fg: "#F6F1E7", rotate: -10, top: "8%", left: "2%", delay: 0.6 },
  { text: "NO MORE SPREADSHEETS", bg: "#15130F", fg: "#F6F1E7", rotate: 6, top: "18%", right: "0%", delay: 0.7 },
  { text: "FACULTY APPROVED", bg: "#D6FF3F", fg: "#15130F", rotate: -5, bottom: "14%", left: "0%", delay: 0.8 },
  { text: "★ EST. 2026", bg: "#F6F1E7", fg: "#15130F", rotate: 8, bottom: "6%", right: "4%", delay: 0.9 },
];

export function StickerCluster() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
      {STICKERS.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5, rotate: s.rotate * 3 }}
          animate={{ opacity: 1, scale: 1, rotate: s.rotate }}
          transition={{ type: "spring", stiffness: 140, damping: 10, delay: s.delay }}
          className="absolute animate-wiggle rounded-full border-[1.5px] border-ink px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider shadow-hard-sm"
          style={{
            backgroundColor: s.bg,
            color: s.fg,
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
          }}
        >
          {s.text}
        </motion.div>
      ))}
    </div>
  );
}
