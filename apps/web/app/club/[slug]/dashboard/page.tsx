"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { QrScanner } from "@/components/QrScanner";

interface ClubDetail {
  id: string;
  name: string;
  events: { id: string; title: string; slug: string; status: string }[];
}

interface Stats {
  capacity: number;
  registered: number;
  checkedIn: number;
  noShow: number;
}

interface RegistrationRow {
  id: string;
  status: string;
  user: { name: string; usn: string | null };
  ticketType: { name: string };
  ticket: { status: string } | null;
}

interface SearchResultRow {
  id: string;
  user: { name: string; usn: string | null };
  ticket: { status: string } | null;
}

export default function ClubDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [eventId, setEventId] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultRow[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"CORE_TEAM" | "VOLUNTEER">("VOLUNTEER");
  const [memberMsg, setMemberMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<ClubDetail>(`/clubs/${slug}`, { token }).then((c) => {
      setClub(c);
      if (c.events[0]) setEventId(c.events[0].id);
    });
  }, [slug, token]);

  const refresh = useCallback(() => {
    if (!eventId || !token) return;
    api<Stats>(`/events/${eventId}/checkin-stats`, { token }).then(setStats);
    api<RegistrationRow[]>(`/events/${eventId}/registrations`, { token }).then(setRegistrations);
  }, [eventId, token]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleScan(qrToken: string) {
    if (!token) return;
    try {
      const res = await api("/checkin/verify", { method: "POST", token, body: { token: qrToken } });
      setScanResult(res);
    } catch (err) {
      setScanResult(err instanceof ApiError ? err.data ?? { result: "INVALID" } : { result: "INVALID" });
    }
    refresh();
  }

  async function runSearch(q: string) {
    setSearchQuery(q);
    if (!token || !eventId || q.trim().length < 2) return setSearchResults([]);
    const results = await api<SearchResultRow[]>(
      `/checkin/search?eventId=${eventId}&q=${encodeURIComponent(q)}`,
      { token }
    );
    setSearchResults(results);
  }

  async function manualCheckIn(registrationId: string) {
    if (!token) return;
    try {
      const res = await api("/checkin/manual", { method: "POST", token, body: { registrationId } });
      setScanResult(res);
    } catch (err) {
      setScanResult(err instanceof ApiError ? err.data ?? { result: "INVALID" } : { result: "INVALID" });
    }
    setSearchResults([]);
    setSearchQuery("");
    refresh();
  }

  if (!club) return <p className="text-inkSoft">Loading…</p>;

  const selectedEvent = club.events.find((e) => e.id === eventId);

  async function submitForApproval() {
    if (!token || !eventId) return;
    await api(`/events/${eventId}/submit-for-approval`, { method: "POST", token });
    api<ClubDetail>(`/clubs/${slug}`, { token }).then(setClub);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setMemberMsg(null);
    try {
      const res = await api<{ added: string; role: string }>(`/clubs/${club!.id}/members`, {
        method: "POST",
        token,
        body: { email: memberEmail, role: memberRole },
      });
      setMemberMsg(`Added ${res.added} as ${res.role.replace("_", " ").toLowerCase()}.`);
      setMemberEmail("");
    } catch (err) {
      setMemberMsg(err instanceof ApiError ? err.message : "Could not add member.");
    }
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold italic">
          {club.name} <span className="not-italic text-inkSoft">/ Dashboard</span>
        </h1>
        <Link href={`/club/${slug}/events/new`} className="btn-signal flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide">
          <Plus className="h-3.5 w-3.5" /> New event
        </Link>
      </div>
      <div className="mb-8 mt-4 flex flex-wrap items-center gap-3">
        {club.events.length === 0 ? (
          <p className="text-inkSoft">No events yet — create your first one.</p>
        ) : (
          <>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
            >
              {club.events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            {selectedEvent && <StatusBadge status={selectedEvent.status} />}
            {(selectedEvent?.status === "DRAFT" || selectedEvent?.status === "REJECTED") && (
              <Link href={`/club/${slug}/events/${selectedEvent.slug}/edit`} className="btn-outline flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            )}
            {selectedEvent?.status === "DRAFT" && (
              <button onClick={submitForApproval} className="btn-signal rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide">
                Submit for approval
              </button>
            )}
          </>
        )}
      </div>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Capacity" value={stats.capacity} />
          <StatCard label="Registered" value={stats.registered} />
          <StatCard label="Checked in" value={stats.checkedIn} highlight />
          <StatCard label="No-show (so far)" value={stats.noShow} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold italic">QR Check-in Scanner</h2>
          {!scanning ? (
            <button onClick={() => setScanning(true)} className="btn-signal rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide">
              Start scanning
            </button>
          ) : (
            <>
              <QrScanner active={scanning} onScan={handleScan} />
              <button onClick={() => setScanning(false)} className="mt-3 text-sm text-inkSoft underline">
                Stop
              </button>
            </>
          )}
          {scanResult && (
            <div className="mt-5 border-[1.5px] border-ink bg-paperAlt p-4">
              <StatusBadge status={scanResult.result ?? "INVALID"} />
              {scanResult.name && <p className="mt-2 font-semibold">{scanResult.name}</p>}
              {scanResult.usn && <p className="text-sm text-inkSoft">{scanResult.usn}</p>}
              {scanResult.routedToFaculty && (
                <p className="mt-1 font-mono text-xs text-inkSoft">Attendance routed to subject faculty for approval.</p>
              )}
            </div>
          )}

          <div className="mt-6 border-t-[1.5px] border-dashed border-ink/30 pt-5">
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-inkSoft">Manual check-in (lost/unreadable QR)</h3>
            <input
              value={searchQuery}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search by name or USN…"
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => manualCheckIn(r.id)}
                    disabled={r.ticket?.status === "CHECKED_IN"}
                    className="flex w-full items-center justify-between border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-left text-sm hover:bg-paperAlt disabled:opacity-40"
                  >
                    <span>{r.user.name} <span className="text-inkSoft">· {r.user.usn ?? "—"}</span></span>
                    <StatusBadge status={r.ticket?.status ?? "ISSUED"} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold italic">Registrations</h2>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {registrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b-[1.5px] border-dashed border-ink/20 py-2.5 text-sm">
                <div>
                  <div>{r.user.name}</div>
                  <div className="text-inkSoft">{r.user.usn ?? "—"} · {r.ticketType.name}</div>
                </div>
                <StatusBadge status={r.ticket?.status ?? r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-1 font-display text-xl font-semibold italic">Add a team member</h2>
        <p className="mb-4 text-sm text-inkSoft">They need a Konvene account already — just their email.</p>
        <form onSubmit={addMember} className="flex flex-wrap items-center gap-3">
          <input
            type="email" required placeholder="member@college.edu" value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="flex-1 border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
          />
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value as "CORE_TEAM" | "VOLUNTEER")}
            className="border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
          >
            <option value="VOLUNTEER">Volunteer</option>
            <option value="CORE_TEAM">Core team</option>
          </select>
          <button className="btn-signal rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wide">Add</button>
        </form>
        {memberMsg && <p className="mt-3 text-sm font-medium">{memberMsg}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border-[1.5px] border-ink p-4 ${highlight ? "bg-acid" : "bg-paperAlt"}`}>
      <div className="font-display text-2xl font-semibold">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">{label}</div>
    </div>
  );
}
