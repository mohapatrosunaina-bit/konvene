"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { Calendar, Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryStyle } from "@/lib/utils";

interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "file";
  options?: string[];
  required?: boolean;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  startAt: string;
  endAt: string;
  capacity: number;
  club: { name: string; slug: string };
  ticketTypes: { id: string; name: string; capacity: number }[];
  form: { schemaJson: string } | null;
  _count: { registrations: number };
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, token } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<EventDetail>(`/events/${slug}`).then((e) => {
      setEvent(e);
      setTicketTypeId(e.ticketTypes[0]?.id ?? "");
    });
  }, [slug]);

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-48 animate-pulse border-[1.5px] border-ink bg-paperAlt" />
        <div className="h-8 w-2/3 animate-pulse bg-paperAlt" />
      </div>
    );
  }

  const fields: FormField[] = event.form ? JSON.parse(event.form.schemaJson) : [];
  const spotsLeft = event.capacity - event._count.registrations;
  const { bg } = categoryStyle(event.category);

  async function register() {
    if (!token) return setError("Log in first to register.");
    setBusy(true);
    setError(null);
    try {
      const res = await api(`/events/${event!.id}/register`, {
        method: "POST",
        token,
        body: { ticketTypeId, formResponses: formValues },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden border-[1.5px] border-ink p-8"
        style={{ backgroundColor: bg }}
      >
        <div className="absolute inset-0 bg-dot-grid bg-dots opacity-20 mix-blend-overlay" />
        <div className="relative">
          <span className="rounded-full border-[1.5px] border-ink bg-paper px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-ink">
            {event.category}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-paper sm:text-4xl">{event.title}</h1>
          <p className="mt-1 italic text-paper/80">by {event.club.name}</p>
        </div>
      </motion.div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Calendar, label: "Starts", value: new Date(event.startAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) },
          { icon: Clock, label: "Time", value: new Date(event.startAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) },
          { icon: MapPin, label: "Venue", value: event.venue },
          { icon: Users, label: "Spots left", value: Math.max(spotsLeft, 0).toString() },
        ].map((item) => (
          <div key={item.label} className="card-alt border-[1.5px] p-4">
            <item.icon className="mb-2 h-4 w-4 text-signal" />
            <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">{item.label}</div>
            <div className="truncate text-sm font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      <p className="mb-10 whitespace-pre-wrap text-base leading-relaxed text-inkSoft">{event.description}</p>

      <div className="card p-6 sm:p-8">
        {result ? (
          <RegistrationResult result={result} />
        ) : (
          <>
            <h2 className="mb-5 font-display text-2xl font-semibold italic">Register for this event</h2>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Ticket type</label>
            <select
              value={ticketTypeId}
              onChange={(e) => setTicketTypeId(e.target.value)}
              className="mb-5 w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
            >
              {event.ticketTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {fields.map((f) => (
              <div key={f.key} className="mb-5">
                <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">
                  {f.label}{f.required && " *"}
                </label>
                {f.type === "select" ? (
                  <select
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
                  />
                ) : (
                  <input
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
                  />
                )}
              </div>
            ))}

            {error && <p className="mb-3 text-sm font-medium text-berry">{error}</p>}
            <button
              onClick={register}
              disabled={busy || !user}
              className="btn-signal w-full py-3.5 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
            >
              {!user ? "Log in to register" : busy ? "Registering…" : spotsLeft <= 0 ? "Join waitlist" : "Register now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RegistrationResult({ result }: { result: any }) {
  useEffect(() => {
    if (result.waitlisted) return;
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF4A1F", "#1F32E0", "#D6FF3F", "#15130F"],
      shapes: ["square"],
      scalar: 0.9,
    });
  }, [result]);

  if (result.waitlisted) {
    return (
      <div>
        <StatusBadge status="WAITLISTED" />
        <p className="mt-3 text-inkSoft">
          This event is at capacity — you're on the waitlist and will be promoted automatically if a spot opens up.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <div className="mb-3 flex justify-center">
        <CheckCircle2 className="h-10 w-10 text-moss" />
      </div>
      <p className="mb-5 font-display text-lg font-semibold italic">You're in! Show this QR code at the door.</p>
      <div className="mx-auto inline-block border-[1.5px] border-ink bg-paper p-5">
        <QRCodeSVG value={result.ticket.qrToken} size={180} />
      </div>
      <p className="mt-3 font-mono text-xs text-inkSoft">Ticket ID: {result.ticket.id}</p>
    </div>
  );
}
