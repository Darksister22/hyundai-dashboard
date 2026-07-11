"use client";

import { useState } from "react";
import { Loader2, X, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { uuidv4 } from "@/lib/uuid";
import { TriField } from "@/components/form/primitives";
import { IRAQ_PROVINCES } from "@/lib/iraq";
import { emptyTri, type Tri } from "@/types/car-form";
import type { LocationRow } from "@/types/db";

export interface LocationDraft {
  id: string;
  province: string;
  city: Tri;
  landmark: Tri;
  mapUrl: string;
}

export function locationToDraft(l: LocationRow): LocationDraft {
  return {
    id: l.id,
    province: l.province ?? "",
    city: { ar: l.city_ar ?? "", en: l.city_en ?? "", ku: l.city_ku ?? "" },
    landmark: {
      ar: l.landmark_ar ?? "",
      en: l.landmark_en ?? "",
      ku: l.landmark_ku ?? "",
    },
    mapUrl: l.map_url ?? "",
  };
}

export function newLocationDraft(): LocationDraft {
  return {
    id: uuidv4(),
    province: "",
    city: emptyTri(),
    landmark: emptyTri(),
    mapUrl: "",
  };
}

export function LocationEditor({
  draft: initial,
  isNew,
  onClose,
  onSaved,
}: {
  draft: LocationDraft;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<LocationDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!draft.province) {
      setError("Pick a province.");
      return;
    }
    const mapUrl = draft.mapUrl.trim();
    if (mapUrl && !/^https?:\/\//i.test(mapUrl)) {
      setError("Enter a full link starting with https://");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase isn't connected.");
      return;
    }
    setSaving(true);
    const v = (s: string) => (s.trim() ? s.trim() : null);
    const payload = {
      province: draft.province,
      city_ar: v(draft.city.ar),
      city_en: v(draft.city.en),
      city_ku: v(draft.city.ku),
      landmark_ar: v(draft.landmark.ar),
      landmark_en: v(draft.landmark.en),
      landmark_ku: v(draft.landmark.ku),
      map_url: mapUrl || null,
    };

    let err;
    if (isNew) {
      const { count } = await supabase
        .from("locations")
        .select("*", { count: "exact", head: true });
      ({ error: err } = await supabase
        .from("locations")
        .insert({ id: draft.id, sort_order: count ?? 0, ...payload }));
    } else {
      ({ error: err } = await supabase
        .from("locations")
        .update(payload)
        .eq("id", draft.id));
    }

    if (err) {
      setError(friendlyError(err.message));
      setSaving(false);
      return;
    }
    onSaved();
  }

  const inputCls =
    "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-sky)]";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
          <h3 className="font-semibold text-[var(--color-ink)]">
            {isNew ? "Add location" : "Edit location"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-[var(--color-ink)]">
              Province <span className="text-[var(--color-danger)]">*</span>
            </span>
            <select
              value={draft.province}
              onChange={(e) =>
                setDraft((d) => ({ ...d, province: e.target.value }))
              }
              className={inputCls}
            >
              <option value="">Select a province…</option>
              {IRAQ_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <TriField
            label="City"
            value={draft.city}
            onChange={(city) => setDraft((d) => ({ ...d, city }))}
          />

          <TriField
            label="Closest known point"
            value={draft.landmark}
            onChange={(landmark) => setDraft((d) => ({ ...d, landmark }))}
            placeholder="e.g. near the Grand Mall"
          />

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
              Google Maps link
            </span>
            <input
              value={draft.mapUrl}
              onChange={(e) => setDraft((d) => ({ ...d, mapUrl: e.target.value }))}
              placeholder="https://maps.google.com/..."
              inputMode="url"
              className={inputCls}
            />
            <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">
              In Google Maps, open the place → Share → Copy link, and paste it
              here.
            </span>
          </label>

          {error ? (
            <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-50)] px-3 py-2 text-[13px] text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] bg-[var(--color-app)] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-4 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-5 text-sm font-medium text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {isNew ? "Add location" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}