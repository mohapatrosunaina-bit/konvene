import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for OAuth login.");
}

/**
 * Browser-only Supabase client using the public anon key. OAuth (Google/
 * GitHub) sign-in has to happen client-side — the redirect to the provider's
 * consent screen and the session it hands back both live in the browser, so
 * this is the one place the frontend talks to Supabase directly instead of
 * going through our own API.
 */
export const supabaseBrowser = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
