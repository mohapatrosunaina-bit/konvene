"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EventForm } from "@/components/EventForm";

interface ClubDetail {
  id: string;
  name: string;
}

export default function NewEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token, user, loading, hasRole } = useAuth();
  const [club, setClub] = useState<ClubDetail | null>(null);

  useEffect(() => {
    api<ClubDetail>(`/clubs/${slug}`, token ? { token } : {}).then(setClub);
  }, [slug, token]);

  if (loading || !club) return <p className="text-inkSoft">Loading…</p>;

  const canCreate = hasRole("ADMIN") || user?.clubMemberships?.some((m) => m.club.slug === slug && m.role === "CLUB_HEAD") || false;
  if (!canCreate) {
    return <p className="text-inkSoft">Only this club's head can create events here.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl font-semibold italic">New event</h1>
      <p className="mb-8 text-sm text-inkSoft">for {club.name} — saved as a draft, submit for approval when ready.</p>
      <EventForm clubId={club.id} clubSlug={slug} />
    </div>
  );
}
