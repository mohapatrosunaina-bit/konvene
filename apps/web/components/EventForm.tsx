"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const CATEGORIES = [
  "WORKSHOP", "HACKATHON", "CONFERENCE", "TALK", "SEMINAR", "SPORTS", "CULTURAL",
  "TECHNICAL", "MUSIC", "DANCE", "FEST", "BOOTCAMP", "PLACEMENT", "COMPETITION",
];

interface TicketTypeRow {
  name: string;
  capacity: number;
}

interface FormFieldRow {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "file";
  options: string;
  required: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  branch: { name: string; department: { name: string } };
}

export interface EventFormInitial {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  venue: string;
  startAt: string;
  endAt: string;
  capacity: number;
  requiresFacultyAttendance: boolean;
  linkedSubjectId: string | null;
  ticketTypes: { name: string; capacity: number }[];
  form: { schemaJson: string } | null;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ clubId, clubSlug, initial }: { clubId: string; clubSlug: string; initial?: EventFormInitial }) {
  const { token } = useAuth();
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [startAt, setStartAt] = useState(initial ? toDatetimeLocal(initial.startAt) : "");
  const [endAt, setEndAt] = useState(initial ? toDatetimeLocal(initial.endAt) : "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? 50);
  const [requiresFacultyAttendance, setRequiresFacultyAttendance] = useState(initial?.requiresFacultyAttendance ?? false);
  const [linkedSubjectId, setLinkedSubjectId] = useState(initial?.linkedSubjectId ?? "");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeRow[]>(
    initial?.ticketTypes.length ? initial.ticketTypes : [{ name: "General", capacity: 50 }]
  );
  const [fields, setFields] = useState<FormFieldRow[]>(
    initial?.form
      ? JSON.parse(initial.form.schemaJson).map((f: any) => ({ ...f, options: (f.options ?? []).join(", ") }))
      : []
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Subject[]>("/subjects").then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }, [title, slugTouched]);

  function addTicketType() {
    setTicketTypes((t) => [...t, { name: "", capacity: 20 }]);
  }
  function updateTicketType(i: number, patch: Partial<TicketTypeRow>) {
    setTicketTypes((t) => t.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeTicketType(i: number) {
    setTicketTypes((t) => t.filter((_, idx) => idx !== i));
  }

  function addField() {
    setFields((f) => [...f, { key: "", label: "", type: "text", options: "", required: false }]);
  }
  function updateField(i: number, patch: Partial<FormFieldRow>) {
    setFields((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const payload = {
      title,
      description,
      category,
      venue,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      capacity: Number(capacity),
      requiresFacultyAttendance,
      linkedSubjectId: requiresFacultyAttendance && linkedSubjectId ? linkedSubjectId : undefined,
      ticketTypes: ticketTypes.map((t) => ({ name: t.name, capacity: Number(t.capacity) })),
      formFields: fields
        .filter((f) => f.key && f.label)
        .map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          ...(f.type === "select" ? { options: f.options.split(",").map((o) => o.trim()).filter(Boolean) } : {}),
        })),
    };

    try {
      if (isEdit) {
        await api(`/events/${initial!.id}`, { method: "PATCH", token, body: payload });
      } else {
        await api("/events", { method: "POST", token, body: { clubId, slug, ...payload } });
      }
      router.push(`/club/${clubSlug}/dashboard`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="card space-y-5 p-6">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">
            Slug {isEdit && <span className="normal-case text-inkSoft/60">(locked after creation)</span>}
          </label>
          <input
            required disabled={isEdit} value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Description</label>
          <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Venue</label>
            <input required value={venue} onChange={(e) => setVenue(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Starts</label>
            <input required type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Ends</label>
            <input required type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Total capacity</label>
            <input required type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={requiresFacultyAttendance} onChange={(e) => setRequiresFacultyAttendance(e.target.checked)} />
          <span className="text-sm font-medium">Counts toward academic attendance (routes to subject faculty for approval)</span>
        </label>
        {requiresFacultyAttendance && (
          <select value={linkedSubjectId} onChange={(e) => setLinkedSubjectId(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt">
            <option value="">Select a subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.branch.name})</option>
            ))}
          </select>
        )}
      </div>

      <div className="card space-y-3 p-6">
        <h3 className="font-display text-lg font-semibold italic">Ticket types</h3>
        {ticketTypes.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input placeholder="Name (e.g. General)" required value={t.name} onChange={(e) => updateTicketType(i, { name: e.target.value })}
              className="flex-1 border-[1.5px] border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-paperAlt" />
            <input type="number" min={1} placeholder="Capacity" required value={t.capacity} onChange={(e) => updateTicketType(i, { capacity: Number(e.target.value) })}
              className="w-28 border-[1.5px] border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-paperAlt" />
            {ticketTypes.length > 1 && (
              <button type="button" onClick={() => removeTicketType(i)} className="p-2 text-berry"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={addTicketType} className="btn-outline flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide">
          <Plus className="h-3.5 w-3.5" /> Add ticket type
        </button>
      </div>

      <div className="card space-y-3 p-6">
        <h3 className="font-display text-lg font-semibold italic">Custom registration fields</h3>
        <p className="text-sm text-inkSoft">Name, USN, branch, year are always collected automatically — add anything event-specific here.</p>
        {fields.map((f, i) => (
          <div key={i} className="grid gap-2 border-[1.5px] border-dashed border-ink/30 p-3 sm:grid-cols-2">
            <input placeholder="Key (e.g. githubUrl)" value={f.key} onChange={(e) => updateField(i, { key: e.target.value })}
              className="border-[1.5px] border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-paperAlt" />
            <input placeholder="Label (e.g. GitHub URL)" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })}
              className="border-[1.5px] border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-paperAlt" />
            <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FormFieldRow["type"] })}
              className="border-[1.5px] border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-paperAlt">
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="file">File</option>
            </select>
            {f.type === "select" ? (
              <input placeholder="Options, comma separated" value={f.options} onChange={(e) => updateField(i, { options: e.target.value })}
                className="border-[1.5px] border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-paperAlt" />
            ) : <div />}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} /> Required
            </label>
            <button type="button" onClick={() => removeField(i)} className="justify-self-end text-berry"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={addField} className="btn-outline flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide">
          <Plus className="h-3.5 w-3.5" /> Add field
        </button>
      </div>

      {error && <p className="text-sm font-medium text-berry">{error}</p>}
      <button disabled={busy} className="btn-signal flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase tracking-wide disabled:opacity-50">
        {busy ? "Saving…" : isEdit ? "Save changes" : "Create event (draft)"} {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
