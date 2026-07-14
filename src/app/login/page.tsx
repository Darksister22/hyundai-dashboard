"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { homeFor, type Role } from "@/lib/roles";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase isn't connected. Add your env vars and restart.");
      return;
    }
    setLoading(true);
    const { data: signIn, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(friendlyError(error.message));
      setLoading(false);
      return;
    }
    // Land on the section this role can actually open.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signIn.user.id)
      .maybeSingle();
    router.push(homeFor((profile?.role ?? null) as Role | null));
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--color-navy-900)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-white font-bold text-[var(--color-navy)]">
            H
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-white">
              HYUNDAI IRAQ
            </div>
            <div className="text-[11px] text-white/55">Content dashboard</div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Use your admin email and password.
          </p>

          {!configured ? (
            <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-app)] px-3 py-2 text-[13px] text-[var(--color-ink-muted)]">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-sky)]" />
              Supabase isn&apos;t connected yet. Add your environment variables
              and restart the dev server.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-sky)]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-sky)]"
              />
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-50)] px-3 py-2 text-[13px] text-[var(--color-danger)]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !configured}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] text-sm font-medium text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
