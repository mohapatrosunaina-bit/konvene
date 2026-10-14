import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required — auth and storage both depend on them.");
}

/**
 * Server-only Supabase client using the service_role key. This is what
 * actually owns authentication: password hashing/verification, session
 * issuance, and token validation all happen inside Supabase Auth, not in
 * our own code. Never expose this client or its key to the frontend.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface VerifiedAuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Verifies a Supabase-issued access token and returns the auth user, or null
 * if invalid/expired. Also surfaces name/avatar from the provider's profile
 * (Google/GitHub put these in user_metadata) so a first-time OAuth login can
 * auto-provision our app-level User row without an extra round trip.
 */
export async function verifySupabaseToken(token: string): Promise<VerifiedAuthUser | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  const meta = data.user.user_metadata ?? {};
  return {
    id: data.user.id,
    email: data.user.email!,
    name: meta.full_name ?? meta.name ?? meta.user_name ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}
