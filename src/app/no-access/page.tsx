"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NoAccessPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--color-app)] px-6">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[var(--color-danger-50)] text-[var(--color-danger)]">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">
          No role assigned
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Your account exists but hasn&apos;t been given a role yet, so no
          dashboard sections are available. Ask your administrator to assign
          one, then sign in again.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-navy-700)]"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
