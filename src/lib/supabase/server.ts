import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Server Supabase client (reads cookies). Used by server components and,
 * later, by auth-gated routes. Returns null when env vars are missing.
 */
export async function createClient() {
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // No-op in Server Components. Once auth is added, a middleware will
      // refresh sessions and write cookies on the response.
      setAll() {},
    },
  });
}
