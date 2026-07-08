"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Browser Supabase client. Returns null when env vars are missing so the
 * UI can show a "connect Supabase" state instead of crashing during setup.
 */
export function createClient() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
