"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { pick } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TriField } from "@/components/form/primitives";
import { useDialog } from "@/components/ui/dialog";
import { emptyTri, type Tri } from "@/types/car-form";

interface Row {
  id: number;
  sort_order: number;
  value?: number | null;
  [key: string]: unknown;
}

interface Draft {
  label: Tri;
  value: string; // kept as string for the input; parsed on save
}

export function ListEditor({
  title,
  description,
  table,
  base, // "name" | "label"
  hasValue = false,
}: {
  title: string;
  description: string;
  table: string;
  base: "name" | "label";
  hasValue?: boolean;
}) {
  const { confirm } = useDialog();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ label: emptyTri(), value: "" });
  const [saving, setSaving] = useState(false);

  const cols = `id,sort_order,${base}_ar,${base}_en,${base}_ku${hasValue ? ",value" : ""}`;

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (error) setError(friendlyError(error.message));
    else setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    setEditing("new");
    setDraft({ label: emptyTri(), value: "" });
    setError(null);
  }

  function startEdit(row: Row) {
    setEditing(row.id);
    setDraft({
      label: {
        ar: (row[`${base}_ar`] as string) ?? "",
        en: (row[`${base}_en`] as string) ?? "",
        ku: (row[`${base}_ku`] as string) ?? "",
      },
      value: row.value != null ? String(row.value) : "",
    });
    setError(null);
  }

  async function save() {
    const supabase = createClient();
    if (!supabase) return;
    if (!draft.label.en.trim()) {
      setError("The English label is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const v = (x: string) => (x.trim() ? x.trim() : null);
    const payload: Record<string, unknown> = {
      [`${base}_ar`]: v(draft.label.ar),
      [`${base}_en`]: v(draft.label.en),
      [`${base}_ku`]: v(draft.label.ku),
    };
    if (hasValue) {
      const n = parseInt(draft.value, 10);
      payload.value = Number.isFinite(n) ? n : null;
    }

    let err;
    if (editing === "new") {
      payload.sort_order = rows.length;
      ({ error: err } = await supabase.from(table).insert(payload));
    } else {
      ({ error: err } = await supabase.from(table).update(payload).eq("id", editing));
    }

    if (err) {
      setError(friendlyError(err.message));
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(null);
    await load();
  }

  async function remove(row: Row) {
    const supabase = createClient();
    if (!supabase) return;
    const label = pick(row, base) || "this item";
    const ok = await confirm({
      title: `Delete "${label}"?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) {
      const msg = error.message.toLowerCase().includes("foreign key")
        ? `Can't delete "${label}" — one or more cars still use it.`
        : friendlyError(error.message);
      setError(msg);
      return;
    }
    setRows((r) => r.filter((x) => x.id !== row.id));
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--color-ink)]">{title}</h3>
          <p className="text-sm text-[var(--color-ink-muted)]">{description}</p>
        </div>
        {editing !== "new" ? (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-3.5 text-sm font-medium text-white hover:bg-[var(--color-navy-700)]"
          >
            <Plus className="size-4" /> Add
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {editing === "new" ? (
        <DraftCard
          draft={draft}
          setDraft={setDraft}
          hasValue={hasValue}
          saving={saving}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[var(--color-ink-muted)]">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 && editing !== "new" ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
          Nothing here yet. Add your first one.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-line)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)]">
          {rows.map((row) =>
            editing === row.id ? (
              <li key={row.id} className="bg-[var(--color-app)] p-4">
                <DraftCard
                  draft={draft}
                  setDraft={setDraft}
                  hasValue={hasValue}
                  saving={saving}
                  onSave={save}
                  onCancel={() => setEditing(null)}
                  embedded
                />
              </li>
            ) : (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 bg-[var(--color-surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-ink)]">
                      {(row[`${base}_en`] as string) || "—"}
                    </span>
                    {hasValue && row.value != null ? (
                      <span className="rounded-full bg-[var(--color-sky-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-navy)]">
                        {row.value}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex gap-3 text-[13px] text-[var(--color-ink-muted)]">
                    {row[`${base}_ar`] ? (
                      <span dir="rtl">{row[`${base}_ar`] as string}</span>
                    ) : (
                      <span className="text-[var(--color-ink-faint)]">ar: —</span>
                    )}
                    {row[`${base}_ku`] ? (
                      <span dir="rtl">{row[`${base}_ku`] as string}</span>
                    ) : (
                      <span className="text-[var(--color-ink-faint)]">ku: —</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    aria-label="Edit"
                    className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-navy)]"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    aria-label="Delete"
                    className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}

function DraftCard({
  draft,
  setDraft,
  hasValue,
  saving,
  onSave,
  onCancel,
  embedded,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  hasValue: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  embedded?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-4",
        !embedded &&
          "mb-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-app)] p-4"
      )}
    >
      <TriField
        label="Label"
        required
        value={draft.label}
        onChange={(label) => setDraft({ ...draft, label })}
      />
      {hasValue ? (
        <div className="max-w-[180px]">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
            Number of seats
          </span>
          <input
            type="number"
            min={1}
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            placeholder="e.g. 5"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm focus:border-[var(--color-sky)]"
          />
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-medium text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}{" "}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-4 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
        >
          <X className="size-4" /> Cancel
        </button>
      </div>
    </div>
  );
}
