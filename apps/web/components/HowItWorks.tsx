"use client";

import { motion } from "framer-motion";

const STEPS = [
  { n: "01", title: "Register", desc: "Custom form, ticket types, waitlist — done in one page.", bg: "#1F32E0" },
  { n: "02", title: "Get your QR", desc: "Cryptographically signed. Can't be forged or duplicated.", bg: "#FF4A1F" },
  { n: "03", title: "Scan at the door", desc: "Volunteer scans, status flips instantly. No paper.", bg: "#0E9594" },
  { n: "04", title: "Faculty verifies", desc: "Routed to the actual subject faculty, not a generic click.", bg: "#6C3EA6" },
  { n: "05", title: "Certificate issued", desc: "Auto-generated PDF, publicly verifiable by anyone.", bg: "#1F6D4C" },
];

export function HowItWorks() {
  return (
    <section className="mb-20 border-t-[1.5px] border-ink pt-14">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="font-display text-3xl font-semibold italic sm:text-4xl">How it actually works</h2>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-inkSoft sm:block">Five steps. Zero spreadsheets.</span>
      </div>

      <div className="relative grid gap-8 sm:grid-cols-5">
        {/* connecting line */}
        <svg className="pointer-events-none absolute left-0 right-0 top-6 hidden w-full sm:block" height="4" preserveAspectRatio="none">
          <line x1="10%" y1="2" x2="90%" y2="2" stroke="#15130F" strokeWidth="1.5" strokeDasharray="6 6" />
        </svg>

        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="relative flex flex-col items-start"
          >
            <span
              className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink font-mono text-sm font-bold"
              style={{ backgroundColor: s.bg, color: "#F6F1E7" }}
            >
              {s.n}
            </span>
            <h3 className="font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-inkSoft">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
