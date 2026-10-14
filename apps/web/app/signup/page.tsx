"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OAuthButtons } from "@/components/OAuthButtons";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signup(name, email, password, usn || undefined);
      router.push("/");
    } catch {
      setError("Could not sign up — email may already be registered.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="stamp mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink bg-cobalt font-display text-xl font-semibold text-paper">
            K
          </span>
          <h1 className="font-display text-3xl font-semibold italic">Join the club</h1>
          <p className="mt-1 text-sm text-inkSoft">Create your Konvene account</p>
        </div>

        <div className="card space-y-4 p-6">
          <OAuthButtons />

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-ink/20" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-inkSoft">or with email</span>
            <div className="h-px flex-1 bg-ink/20" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">College email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">USN (optional)</label>
            <input value={usn} onChange={(e) => setUsn(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt" />
          </div>
          {error && <p className="text-sm font-medium text-berry">{error}</p>}
          <button
            disabled={busy}
            className="btn-signal flex w-full items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
          >
            {busy ? "Creating account…" : "Sign up"} {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-inkSoft">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-2">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
