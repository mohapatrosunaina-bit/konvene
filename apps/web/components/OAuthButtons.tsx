"use client";

import { useState } from "react";
import { useAuth, OAuthProvider } from "@/lib/auth";

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.6 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.66-3.87 2.66-6.62Z" stroke="#15130F" strokeWidth="0.5" fill="#15130F" fillOpacity="0.9" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18Z" stroke="#15130F" strokeWidth="0.5" fill="#15130F" fillOpacity="0.7" />
      <path d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33Z" stroke="#15130F" strokeWidth="0.5" fill="#15130F" fillOpacity="0.5" />
      <path d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.98 11.43.09 9 .09a9 9 0 0 0-8.04 4.87l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58Z" stroke="#15130F" strokeWidth="0.5" fill="#15130F" fillOpacity="0.85" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C4.03 0 0 4.13 0 9.22c0 4.08 2.58 7.53 6.16 8.75.45.09.62-.2.62-.45v-1.7c-2.5.56-3.03-1.09-3.03-1.09-.41-1.06-1-1.35-1-1.35-.82-.58.06-.57.06-.57.9.06 1.38.95 1.38.95.8 1.42 2.1 1.01 2.62.77.08-.6.31-1.01.57-1.24-2-.23-4.1-1.03-4.1-4.57 0-1.01.35-1.83.93-2.48-.09-.23-.4-1.17.09-2.44 0 0 .76-.25 2.5.95a8.4 8.4 0 0 1 4.55 0c1.73-1.2 2.5-.95 2.5-.95.49 1.27.18 2.21.09 2.44.58.65.93 1.47.93 2.48 0 3.55-2.1 4.33-4.1 4.56.32.29.6.85.6 1.72v2.55c0 .25.17.55.63.45C15.42 16.75 18 13.3 18 9.22 18 4.13 13.97 0 9 0Z"
        fill="#15130F"
      />
    </svg>
  );
}

export function OAuthButtons() {
  const { loginWithProvider } = useAuth();
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  async function handle(provider: OAuthProvider) {
    setBusy(provider);
    try {
      await loginWithProvider(provider);
    } catch {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => handle("google")}
        disabled={busy !== null}
        className="btn-outline flex w-full items-center justify-center gap-2.5 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        <IconGoogle /> {busy === "google" ? "Redirecting…" : "Continue with Google"}
      </button>
      <button
        type="button"
        onClick={() => handle("github")}
        disabled={busy !== null}
        className="btn-outline flex w-full items-center justify-center gap-2.5 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        <IconGitHub /> {busy === "github" ? "Redirecting…" : "Continue with GitHub"}
      </button>
    </div>
  );
}
