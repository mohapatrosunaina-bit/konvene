"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface PendingEventRow {
  id: string;
  title: string;
  slug: string;
  venue: string;
  startAt: string;
  club: { name: string };
}

interface PendingRow {
  id: string;
  status: string;
  attendanceCandidate: {
    checkIn: {
      ticket: {
        registration: {
          user: { name: string; usn: string | null; studentProfile?: { section: { name: string; year: number } } };
          event: { title: string };
        };
      };
    };
  };
}

export default function FacultyPage() {
  const { token, user, hasRole } = useAuth();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingEvents, setPendingEvents] = useState<PendingEventRow[]>([]);

  function refresh() {
    if (!token) return;
    api<PendingRow[]>("/faculty/pending-attendance", { token }).then(setRows);
    if (hasRole("FACULTY_COORDINATOR")) {
      api<PendingEventRow[]>("/events/pending-approval/mine", { token }).then(setPendingEvents);
    }
  }

  useEffect(refresh, [token]);

  async function decideEvent(id: string, decision: "approve" | "reject") {
    if (!token) return;
    if (decision === "reject") {
      const reason = prompt("Reason for rejecting this event?") ?? "Not specified";
      await api(`/events/${id}/reject`, { method: "POST", token, body: { reason } });
    } else {
      await api(`/events/${id}/approve`, { method: "POST", token });
    }
    refresh();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function approveSelected() {
    if (!token || selected.size === 0) return;
    await api("/faculty/pending-attendance/approve", { method: "POST", token, body: { ids: Array.from(selected) } });
    setSelected(new Set());
    refresh();
  }

  async function reject(id: string) {
    if (!token) return;
    const reason = prompt("Reason for rejecting this attendance?") ?? "Not specified";
    await api("/faculty/pending-attendance/reject", { method: "POST", token, body: { id, reason } });
    refresh();
  }

  if (!token) return <p className="text-inkSoft">Log in as faculty to review attendance.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      {hasRole("FACULTY_COORDINATOR") && (
        <section className="mb-12">
          <h1 className="mb-2 font-display text-2xl font-semibold italic">Events Awaiting Your Approval</h1>
          <p className="mb-6 text-sm text-inkSoft">
            As Faculty Coordinator, your approval publishes an event for your club.
          </p>
          {pendingEvents.length === 0 ? (
            <p className="text-inkSoft">No events pending approval.</p>
          ) : (
            <div className="space-y-2">
              {pendingEvents.map((e) => (
                <div key={e.id} className="card flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-sm text-inkSoft">
                      {e.club.name} · {new Date(e.startAt).toLocaleString()} · {e.venue}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => decideEvent(e.id, "approve")} className="btn-signal rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
                      Approve
                    </button>
                    <button onClick={() => decideEvent(e.id, "reject")} className="text-sm font-semibold text-berry underline">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <h1 className="mb-2 font-display text-2xl font-semibold italic">Pending Attendance</h1>
      <p className="mb-6 text-sm text-inkSoft">
        Students who checked in to an event linked to your subject. Approving here credits their official attendance.
      </p>

      {rows.length === 0 ? (
        <p className="text-inkSoft">Nothing pending — you're all caught up, {user?.name}.</p>
      ) : (
        <>
          <button
            onClick={approveSelected}
            disabled={selected.size === 0}
            className="btn-signal mb-4 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide disabled:opacity-40"
          >
            Approve selected ({selected.size})
          </button>
          <div className="space-y-2">
            {rows.map((r) => {
              const { user: student, event } = r.attendanceCandidate.checkIn.ticket.registration;
              return (
                <div key={r.id} className="card flex items-center justify-between p-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-inkSoft">{student.usn} · {event.title}</div>
                    </div>
                  </label>
                  <button onClick={() => reject(r.id)} className="text-sm font-semibold text-berry underline">
                    Reject
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
