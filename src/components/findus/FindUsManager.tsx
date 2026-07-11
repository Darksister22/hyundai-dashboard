"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { pick } from "@/lib/i18n";
import { useDialog } from "@/components/ui/dialog";
import type { LocationRow } from "@/types/db";
import {
  LocationEditor,
  locationToDraft,
  newLocationDraft,
  type LocationDraft,
} from "./LocationEditor";

export function FindUsManager() {
  const { confirm, alert } = useDialog();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ draft: LocationDraft; isNew: boolean } | null>(null);

  const configured = isSupabaseConfigured();

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("sort_order");
    if (error) setError(friendlyError(error.message));
    else setRows((data ?? []) as unknown as LocationRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (configured) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persistOrder(list: LocationRow[]) {
    const supabase = createClient();
    if (!supabase) return;
    await Promise.all(
      list.map((r, i) =>
        supabase.from("locations").update({ sort_order: i }).eq("id", r.id)
      )
    );
  }

  function reorder(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    void persistOrder(next);
  }

  async function remove(r: LocationRow) {
    const supabase = createClient();
    if (!supabase) return;
    const label = [r.province, r.city_en].filter(Boolean).join(" — ") || "this location";
    const ok = await confirm({
      title: `Delete "${label}"?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const prev = rows;
    setRows((list) => list.filter((x) => x.id !== r.id));
    const { error } = await supabase.from("locations").delete().eq("id", r.id);
    if (error) {
      setRows(prev);
      await alert({ title: "Couldn't delete", description: error.message });
    }
  }

  if (!configured) {
    return (
      <div className="px-8 py-6">
        <Notice text="Connect Supabase to manage locations. Add your env vars and restart." />
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Showroom and dealer locations shown on the website&apos;s Find us page.
        </p>
        <button
          type="button"
          onClick={() => setEditing({ draft: newLocationDraft(), isNew: true })}
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-medium text-white hover:bg-[var(--color-navy-700)]"
        >
          <Plus className="size-4" /> Add location
        </button>
      </div>

      {error ? <Notice tone="error" text={error} /> : null}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[var(--color-ink-muted)]">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-14 text-center">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            No locations yet
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
            Add your first showroom or dealer.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-line)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]">
          {rows.map((r, i) => {
            const city = pick(r, "city");
            const landmark = pick(r, "landmark");
            const hasMap = Boolean(r.map_url);
            return (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-sky-100)] text-[var(--color-navy)]">
                    <MapPin className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--color-ink)]">
                      {r.province || "—"}
                      {city ? (
                        <span className="text-[var(--color-ink-muted)]">
                          {" "}
                          · {city}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-[var(--color-ink-muted)]">
                      {landmark || "No landmark"}
                    </div>
                    {hasMap ? (
                      <a
                        href={r.map_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sky)] hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        View on map
                      </a>
                    ) : (
                      <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">
                        No map link
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => reorder(i, -1)}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    disabled={i === rows.length - 1}
                    onClick={() => reorder(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Edit"
                    onClick={() => setEditing({ draft: locationToDraft(r), isNew: false })}
                  >
                    <Pencil className="size-4" />
                  </IconBtn>
                  <IconBtn label="Delete" danger onClick={() => remove(r)}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <LocationEditor
          draft={editing.draft}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        "grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] transition-colors disabled:opacity-30 " +
        (danger
          ? "hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]"
          : "hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]")
      }
    >
      {children}
    </button>
  );
}

function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "error" }) {
  return (
    <div
      className={
        "mb-4 flex items-start gap-2.5 rounded-[var(--radius-md)] border px-4 py-3 text-sm " +
        (tone === "error"
          ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-50)] text-[var(--color-danger)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]")
      }
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}