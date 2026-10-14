"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function NewClubPage() {
  const { token, hasRole, loading } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [facultyAdvisorName, setFacultyAdvisorName] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Department[]>("/departments").then((d) => {
      setDepartments(d);
      if (d[0]) setDepartmentId(d[0].id);
    });
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  }, [name, slugTouched]);

  if (loading) return <p className="text-inkSoft">Loading…</p>;
  if (!hasRole("ADMIN")) return <p className="text-inkSoft">Admins only.</p>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const club = await api<{ slug: string }>("/clubs", {
        method: "POST",
        token,
        body: { name, slug, description, departmentId, facultyAdvisorName, headEmail },
      });
      router.push(`/club/${club.slug}/dashboard`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create club.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-display text-3xl font-semibold italic">New club</h1>
      <p className="mb-8 text-sm text-inkSoft">The head needs a Konvene account already — enter their email.</p>

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Club name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Slug</label>
          <input required value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Department</label>
          <select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt">
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Faculty advisor (optional)</label>
          <input value={facultyAdvisorName} onChange={(e) => setFacultyAdvisorName(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Club head's email</label>
          <input type="email" required value={headEmail} onChange={(e) => setHeadEmail(e.target.value)}
            className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
        </div>
        {error && <p className="text-sm font-medium text-berry">{error}</p>}
        <button disabled={busy} className="btn-signal flex w-full items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50">
          {busy ? "Creating…" : "Create club"} {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
