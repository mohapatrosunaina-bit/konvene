"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EventForm, EventFormInitial } from "@/components/EventForm";

interface EventDetail extends EventFormInitial {
  clubId: string;
  status: string;
}

export default function EditEventPage() {
  const { slug, eventSlug } = useParams<{ slug: string; eventSlug: string }>();
  const { user, loading, hasRole } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);

  useEffect(() => {
    api<EventDetail>(`/events/${eventSlug}`).then(setEvent);
  }, [eventSlug]);

  if (loading || !event) return <p className="text-inkSoft">Loading…</p>;

  const canEdit = hasRole("ADMIN") || user?.clubMemberships?.some((m) => m.club.slug === slug && m.role === "CLUB_HEAD") || false;
  if (!canEdit) return <p className="text-inkSoft">Only this club's head can edit events.</p>;
  if (event.status !== "DRAFT" && event.status !== "REJECTED") {
    return <p className="text-inkSoft">This event is {event.status.toLowerCase().replace("_", " ")} and can no longer be edited.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl font-semibold italic">Edit event</h1>
      <p className="mb-8 text-sm text-inkSoft">{event.title}</p>
      <EventForm clubId={event.clubId} clubSlug={slug} initial={event} />
    </div>
  );
}
