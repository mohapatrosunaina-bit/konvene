"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api } from "./api";
import { supabaseBrowser } from "./supabaseClient";

interface RoleAssignment {
  role: string;
  scopeType: string;
  scopeId: string | null;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  usn?: string | null;
  roles?: RoleAssignment[];
  clubMemberships?: { club: { id: string; slug: string; name: string }; role: string }[];
}

export type OAuthProvider = "google" | "github";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, usn?: string) => Promise<void>;
  loginWithProvider: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Every login path — email/password (via our own API) or OAuth (Google/
 * GitHub, direct to Supabase) — ends up as a Supabase session. This provider
 * treats the Supabase browser client's session as the single source of
 * truth, so token refresh, sign-out, and OAuth redirects all flow through
 * one listener instead of three separate code paths.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      const me = await api<AuthUser>("/users/me", { token: accessToken });
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) fetchUser(accessToken).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) fetchUser(accessToken);
      else setUser(null);
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchUser]);

  async function login(email: string, password: string) {
    const res = await api<{ token: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await supabaseBrowser.auth.setSession({ access_token: res.token, refresh_token: res.refreshToken });
    await fetchUser(res.token);
  }

  async function signup(name: string, email: string, password: string, usn?: string) {
    const res = await api<{ token: string; refreshToken: string }>("/auth/signup", {
      method: "POST",
      body: { name, email, password, usn },
    });
    await supabaseBrowser.auth.setSession({ access_token: res.token, refresh_token: res.refreshToken });
    await fetchUser(res.token);
  }

  /** Redirects to the provider's consent screen; Supabase hands the session back on return. */
  async function loginWithProvider(provider: OAuthProvider) {
    await supabaseBrowser.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    setToken(null);
    setUser(null);
  }

  function hasRole(role: string) {
    return !!user?.roles?.some((r) => r.role === role || r.role === "ADMIN" || r.role === "SUPER_ADMIN");
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, loginWithProvider, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
