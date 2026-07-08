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
  Film,
  Link2,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { removeFolder } from "@/lib/storage";
import { BUCKET } from "@/lib/upload";
import { friendlyError } from "@/lib/errors";
import { pick } from "@/lib/i18n";
import { useDialog } from "@/components/ui/dialog";
import type { Banner } from "@/types/db";
import {
  BannerEditor,
  bannerToDraft,
  newBannerDraft,
  type BannerDraft,
} from "./BannerEditor";

const SELECT =
  "id,sort_order,title_ar,title_en,title_ku,media_type,media_url,car_id,car:cars(id,name_ar,name_en,name_ku)";

export function BannersManager() {
  const { confirm, alert } = useDialog();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [cars, setCars] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ draft: BannerDraft; isNew: boolean } | null>(null);

  const configured = isSupabaseConfigured();

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const [b, c] = await Promise.all([
      supabase.from("banners").select(SELECT).order("sort_order"),
      supabase.from("cars").select("id,name_ar,name_en,name_ku").order("name_en"),
    ]);
    if (b.error) setError(friendlyError(b.error.message));
    else setBanners((b.data ?? []) as unknown as Banner[]);
    setCars(
      (c.data ?? []).map((r) => ({ id: r.id as string, label: pick(r, "name") }))
    );
    setLoading(false);
  }

  useEffect(() => {
    if (configured) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persistOrder(list: Banner[]) {
    const supabase = createClient();
    if (!supabase) return;
    await Promise.all(
      list.map((b, i) =>
        supabase.from("banners").update({ sort_order: i }).eq("id", b.id)
      )
    );
  }

  function reorder(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= banners.length) return;
    const next = banners.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setBanners(next);
    void persistOrder(next);
  }

  async function remove(b: Banner) {
    const supabase = createClient();
    if (!supabase) return;
    const ok = await confirm({
      title: "Delete this banner?",
      description: "Its media will be removed too.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const prev = banners;
    setBanners((list) => list.filter((x) => x.id !== b.id));
    const { error } = await supabase.from("banners").delete().eq("id", b.id);
    if (error) {
      setBanners(prev);
      await alert({ title: "Couldn't delete", description: error.message });
      return;
    }
    try {
      await removeFolder(supabase, BUCKET, `banners/${b.id}`);
    } catch {
      // ignore — orphaned media only
    }
  }

  if (!configured) {
    return (
      <div className="px-8 py-6">
        <Notice text="Connect Supabase to manage banners. Add your env vars and restart." />
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Cards shown on the website&apos;s hero area. Each can link to a car.
        </p>
        <button
          type="button"
          onClick={() => setEditing({ draft: newBannerDraft(), isNew: true })}
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-medium text-white hover:bg-[var(--color-navy-700)]"
        >
          <Plus className="size-4" /> Add banner
        </button>
      </div>

      {error ? <Notice tone="error" text={error} /> : null}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[var(--color-ink-muted)]">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-14 text-center">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            No banners yet
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
            Add your first banner card.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b, i) => {
            const title = pick(b, "title") || "Untitled banner";
            const carName = b.car ? pick(b.car, "name") : null;
            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]"
              >
                <div className="relative aspect-video bg-[var(--color-app)]">
                  {b.media_url ? (
                    b.media_type === "video" ? (
                      <video src={b.media_url} className="h-full w-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.media_url} alt="" className="h-full w-full object-cover" />
                    )
                  ) : null}
                  {b.media_type === "video" ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                      <Film className="size-3" /> Video
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="truncate font-semibold text-[var(--color-ink)]">
                    {title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-[var(--color-ink-muted)]">
                    <Link2 className="size-3.5 shrink-0" />
                    {carName ? carName : "No linked car"}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => reorder(i, -1)}>
                        <ArrowUp className="size-4" />
                      </IconBtn>
                      <IconBtn
                        label="Move down"
                        disabled={i === banners.length - 1}
                        onClick={() => reorder(i, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </IconBtn>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconBtn
                        label="Edit"
                        onClick={() => setEditing({ draft: bannerToDraft(b), isNew: false })}
                      >
                        <Pencil className="size-4" />
                      </IconBtn>
                      <IconBtn label="Delete" danger onClick={() => remove(b)}>
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing ? (
        <BannerEditor
          draft={editing.draft}
          isNew={editing.isNew}
          cars={cars}
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
