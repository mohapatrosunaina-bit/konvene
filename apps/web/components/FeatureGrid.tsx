"use client";

import { motion } from "framer-motion";

function IconQR() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="4" y="4" width="14" height="14" rx="2" stroke="#15130F" strokeWidth="2" />
      <rect x="26" y="4" width="14" height="14" rx="2" stroke="#15130F" strokeWidth="2" />
      <rect x="4" y="26" width="14" height="14" rx="2" stroke="#15130F" strokeWidth="2" />
      <rect x="9" y="9" width="4" height="4" fill="#15130F" />
      <rect x="31" y="9" width="4" height="4" fill="#15130F" />
      <rect x="9" y="31" width="4" height="4" fill="#15130F" />
      <path d="M27 27H32V32H27V27Z" stroke="#15130F" strokeWidth="2" />
      <path d="M35 27H40" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 33H40V40H35V33Z" stroke="#15130F" strokeWidth="2" />
      <path d="M27 36V40" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M22 4L38 10V20C38 30 31 37 22 40C13 37 6 30 6 20V10L22 4Z" stroke="#15130F" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 21L19 26L30 15" stroke="#15130F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCertificate() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="5" y="5" width="34" height="24" rx="2" stroke="#15130F" strokeWidth="2" />
      <path d="M11 13H33" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 19H26" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="34" r="6" stroke="#15130F" strokeWidth="2" />
      <path d="M12 39L10 44L16 41L22 44L20 39" stroke="#15130F" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconHourglass() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M10 4H34" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 40H34" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 4C12 14 22 18 22 22C22 26 12 30 12 40" stroke="#15130F" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 4C32 14 22 18 22 22C22 26 32 30 32 40" stroke="#15130F" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M6 38H40" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="24" width="6" height="14" stroke="#15130F" strokeWidth="2" />
      <rect x="20" y="14" width="6" height="24" stroke="#15130F" strokeWidth="2" fill="#D6FF3F" />
      <rect x="30" y="20" width="6" height="18" stroke="#15130F" strokeWidth="2" />
      <path d="M10 12L18 6L26 10L36 4" stroke="#FF4A1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconForm() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="7" y="4" width="30" height="36" rx="2" stroke="#15130F" strokeWidth="2" />
      <path d="M13 13H31" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <rect x="13" y="19" width="4" height="4" rx="1" stroke="#15130F" strokeWidth="2" />
      <path d="M21 21H31" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
      <rect x="13" y="27" width="4" height="4" rx="1" fill="#1F32E0" stroke="#15130F" strokeWidth="2" />
      <path d="M21 29H31" stroke="#15130F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: IconShieldCheck, title: "Faculty-verified attendance", bg: "#D6FF3F", big: true,
    desc: "Check-in routes to the exact subject faculty for that student's section — not a generic organizer click. No generic event platform does this for a college.",
  },
  { icon: IconQR, title: "Signed QR tickets", bg: "#F6F1E7", desc: "HMAC-signed tokens. Forged or duplicated scans are rejected before the database is even touched." },
  { icon: IconCertificate, title: "Real certificates", bg: "#F6F1E7", desc: "Auto-generated PDFs, each publicly verifiable by certificate ID — no fake screenshots." },
  { icon: IconHourglass, title: "Waitlists that move", bg: "#F6F1E7", desc: "Cancel a spot, the next person in line is promoted and ticketed automatically." },
  { icon: IconChart, title: "Live dashboards", bg: "#F6F1E7", desc: "Registrations, check-ins, no-shows — updating in real time as the door scans happen." },
  { icon: IconForm, title: "Forms that fit the event", bg: "#F6F1E7", desc: "Build a custom registration form per event — no more one-size-fits-all Google Form." },
];

export function FeatureGrid() {
  return (
    <section className="mb-20 border-t-[1.5px] border-ink pt-14">
      <h2 className="mb-10 font-display text-3xl font-semibold italic sm:text-4xl">
        Built different, <span className="text-signal">on purpose.</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`card card-hover p-6 ${f.big ? "sm:col-span-2 sm:row-span-2" : ""}`}
            style={{ backgroundColor: f.bg }}
          >
            <f.icon />
            <h3 className={`mt-4 font-display font-semibold ${f.big ? "text-2xl" : "text-lg"}`}>{f.title}</h3>
            <p className={`mt-2 text-inkSoft ${f.big ? "max-w-md text-base" : "text-sm"}`}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
