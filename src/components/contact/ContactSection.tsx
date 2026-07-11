"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Inbox, Paperclip, Search } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ContactStatus, ContactSubmission } from "@/types/db";
import { InquiryBadge, StatusBadge, STATUS_LABEL } from "./badges";

type Load = "idle" | "loading" | "ready" | "error" | "unconfigured";
type StatusFilter = "all" | ContactStatus;

const FILTERS: StatusFilter[] = ["all", "new", "in_progress", "resolved"];

export function ContactSection() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<ContactSubmission[]>([]);
  const [state, setState] = useState<Load>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState("unconfigured");
      return;
    }
    let cancelled = false;
    (async () => {
      setState("loading");
      const supabase = createClient();
      if (!supabase) {
        setState("unconfigured");
        return;
      }
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setState("error");
        return;
      }
      setRows((data ?? []) as ContactSubmission[]);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: rows.length,
      new: 0,
      in_progress: 0,
      resolved: 0,
    };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.status === filter);

    const q = query.trim().toLowerCase();
    if (!q) return list;
    // Digits-only variant so "0770..." or "770" matches "+964770..."
    const qDigits = q.replace(/\D/g, "");
    return list.filter((r) => {
      const name = `${r.first_name} ${r.last_name}`.toLowerCase();
      if (name.includes(q)) return true;
      if (r.email && r.email.toLowerCase().includes(q)) return true;
      if (qDigits && r.phone.replace(/\D/g, "").includes(qDigits)) return true;
      return false;
    });
  }, [rows, filter, query]);

  return (
    <div className="px-8 py-6">
      {/* Search + status filter */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, or email"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-sky)]"
          />
        </div>

        <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium transition-colors",
                filter === f
                  ? "bg-[var(--color-sky-100)] text-[var(--color-navy)]"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              )}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
              <span className="text-xs text-[var(--color-ink-faint)]">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ContactContent
        state={state}
        error={error}
        rows={filtered}
        hasQuery={Boolean(query.trim()) || filter !== "all"}
      />
    </div>
  );
}

function ContactContent({
  state,
  error,
  rows,
  hasQuery,
}: {
  state: Load;
  error: string | null;
  rows: ContactSubmission[];
  hasQuery: boolean;
}) {
  if (state === "unconfigured") {
    return (
      <EmptyShell>
        Supabase isn&apos;t connected. Add your environment variables and
        restart the dev server.
      </EmptyShell>
    );
  }
  if (state === "loading" || state === "idle") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    );
  }
  if (state === "error") {
    return (
      <EmptyShell>
        <AlertCircle className="mx-auto mb-2 size-6 text-[var(--color-danger)]" />
        Couldn&apos;t load submissions{error ? ` — ${error}` : "."}
      </EmptyShell>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyShell>
        <Inbox className="mx-auto mb-2 size-6 text-[var(--color-ink-faint)]" />
        {hasQuery
          ? "No submissions match your search or filter."
          : "No contact submissions yet."}
      </EmptyShell>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <SubmissionCard key={row.id} row={row} />
      ))}
    </div>
  );
}

function SubmissionCard({ row }: { row: ContactSubmission }) {
  const name = `${row.first_name} ${row.last_name}`.trim();
  const date = new Date(row.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/contact/${row.id}`}
      className="group block rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-shadow hover:shadow-[0_2px_12px_rgba(0,44,95,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-navy)]">
            {name}
          </div>
          <div
            className="mt-0.5 truncate text-[13px] text-[var(--color-ink-muted)]"
            dir="ltr"
          >
            {row.phone}
          </div>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <InquiryBadge inquiry={row.inquiry_type} />
        <span className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
          {row.attachments.length > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip className="size-3" />
              {row.attachments.length}
            </span>
          ) : null}
          {date}
        </span>
      </div>
    </Link>
  );
}

function EmptyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-14 text-center text-sm text-[var(--color-ink-muted)]">
      {children}
    </div>
  );
}
