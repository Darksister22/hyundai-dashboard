"use client";

import { useRef, useState } from "react";
import { Loader2, X, Film, ImageIcon, AlertCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia, getVideoDuration, MAX_VIDEO_SECONDS } from "@/lib/upload";
import { friendlyError } from "@/lib/errors";
import { uuidv4 } from "@/lib/uuid";
import { TriField } from "@/components/form/primitives";
import { emptyTri, type Tri } from "@/types/car-form";
import type { Banner } from "@/types/db";

export interface BannerDraft {
  id: string;
  title: Tri;
  mediaType: "image" | "video";
  mediaUrl: string | null;
  carId: string | null;
}

export function bannerToDraft(b: Banner): BannerDraft {
  return {
    id: b.id,
    title: {
      ar: b.title_ar ?? "",
      en: b.title_en ?? "",
      ku: b.title_ku ?? "",
    },
    mediaType: b.media_type,
    mediaUrl: b.media_url,
    carId: b.car_id,
  };
}

export function newBannerDraft(): BannerDraft {
  return { id: uuidv4(), title: emptyTri(), mediaType: "image", mediaUrl: null, carId: null };
}

export function BannerEditor({
  draft: initial,
  isNew,
  cars,
  onClose,
  onSaved,
}: {
  draft: BannerDraft;
  isNew: boolean;
  cars: { id: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<BannerDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const isVideo = file.type.startsWith("video/");
    if (isVideo) {
      try {
        const dur = await getVideoDuration(file);
        if (dur > MAX_VIDEO_SECONDS + 0.5) {
          setError(`Video must be ${MAX_VIDEO_SECONDS} seconds or shorter (this one is ${Math.round(dur)}s).`);
          return;
        }
      } catch {
        setError("Couldn't read that video. Try another file.");
        return;
      }
    }
    setBusy(true);
    try {
      const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const { url, type } = await uploadMedia(file, `banners/${draft.id}/media-${token}`);
      setDraft((d) => ({ ...d, mediaUrl: url, mediaType: type }));
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Upload failed"));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setError(null);
    if (!draft.mediaUrl) {
      setError("Add an image or video first.");
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
      title_ar: v(draft.title.ar),
      title_en: v(draft.title.en),
      title_ku: v(draft.title.ku),
      media_type: draft.mediaType,
      media_url: draft.mediaUrl,
      car_id: draft.carId,
    };

    let err;
    if (isNew) {
      // count for sort_order
      const { count } = await supabase
        .from("banners")
        .select("*", { count: "exact", head: true });
      ({ error: err } = await supabase
        .from("banners")
        .insert({ id: draft.id, sort_order: count ?? 0, ...payload }));
    } else {
      ({ error: err } = await supabase
        .from("banners")
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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
          <h3 className="font-semibold text-[var(--color-ink)]">
            {isNew ? "Add banner" : "Edit banner"}
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
          {/* Media */}
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
              Media (image or video, up to {MAX_VIDEO_SECONDS}s)
            </span>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-app)]">
              {draft.mediaUrl ? (
                draft.mediaType === "video" ? (
                  <video
                    src={draft.mediaUrl}
                    className="h-full w-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.mediaUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="flex flex-col items-center gap-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-navy)]"
                >
                  {busy ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <span className="flex gap-1">
                      <ImageIcon className="size-6" />
                      <Film className="size-6" />
                    </span>
                  )}
                  <span className="text-[13px] font-medium">
                    {busy ? "Uploading…" : "Upload image or video"}
                  </span>
                </button>
              )}
              {draft.mediaUrl && busy ? (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              ) : null}
            </div>
            {draft.mediaUrl ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-1.5 text-xs font-medium text-[var(--color-sky)] hover:underline"
              >
                Replace media
              </button>
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                handleFile(f);
              }}
            />
          </div>

          <TriField
            label="Title"
            value={draft.title}
            onChange={(title) => setDraft((d) => ({ ...d, title }))}
          />

          {/* Linked car */}
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
              Linked car
            </span>
            <select
              value={draft.carId ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, carId: e.target.value || null }))
              }
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-sky)]"
            >
              <option value="">No linked car</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">
              On the website, the banner button opens this car&apos;s details.
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
            disabled={saving || busy}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-5 text-sm font-medium text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {isNew ? "Add banner" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
