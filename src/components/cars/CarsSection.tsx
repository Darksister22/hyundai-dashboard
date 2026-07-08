"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Settings2, AlertCircle, CarFront } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { deleteCarAssets } from "@/lib/storage";
import { useDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CarListItem } from "@/types/db";
import { CarCard } from "./CarCard";
import { ListsManager } from "@/components/lists/ListsManager";

type Tab = "cars" | "lists";
type Load = "idle" | "loading" | "ready" | "error" | "unconfigured";

const CAR_SELECT =
  "id,slug,name_ar,name_en,name_ku,hero_image,category:categories(id,name_ar,name_en,name_ku)";

export function CarsSection() {
  const { confirm, alert } = useDialog();
  const [tab, setTab] = useState<Tab>("cars");
  const [query, setQuery] = useState("");
  const [cars, setCars] = useState<CarListItem[]>([]);
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
        .from("cars")
        .select(CAR_SELECT)
        .order("sort_order", { ascending: true })
        .order("name_en", { ascending: true });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setState("error");
        return;
      }
      setCars((data ?? []) as unknown as CarListItem[]);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) => {
      const names = [c.name_ar, c.name_en, c.name_ku];
      const cat = c.category
        ? [c.category.name_ar, c.category.name_en, c.category.name_ku]
        : [];
      return [...names, ...cat]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [cars, query]);

  async function handleDelete(car: CarListItem) {
    const ok = await confirm({
      title: `Delete "${car.name_en}"?`,
      description: "This removes the car and all of its content. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    if (!supabase) return;
    const prev = cars;
    setCars((list) => list.filter((c) => c.id !== car.id)); // optimistic
    const { error } = await supabase.from("cars").delete().eq("id", car.id);
    if (error) {
      setCars(prev); // roll back
      await alert({ title: "Couldn't delete", description: error.message });
      return;
    }
    // Best-effort: remove the car's images so the bucket doesn't fill up with
    // orphans. If this fails, the car is still deleted — we just leave files.
    try {
      await deleteCarAssets(supabase, car.id);
    } catch {
      // ignore — orphaned files only, not worth surfacing
    }
  }

  return (
    <div className="px-8 py-6">
      {/* Top toggle: Cars | Category lists */}
      <div className="mb-6 inline-flex rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1">
        <TabButton active={tab === "cars"} onClick={() => setTab("cars")}>
          <CarFront className="size-4" /> Cars
        </TabButton>
        <TabButton active={tab === "lists"} onClick={() => setTab("lists")}>
          <Settings2 className="size-4" /> Lists
        </TabButton>
      </div>

      {tab === "cars" ? (
        <>
          {/* Search + add */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by car name or category"
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-sky)]"
              />
            </div>
            <Link
              href="/cars/new"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-navy-700)]"
            >
              <Plus className="size-4" /> Add new car
            </Link>
          </div>

          <CarsContent
            state={state}
            error={error}
            cars={filtered}
            hasQuery={Boolean(query.trim())}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <ListsManager />
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-navy)] text-white"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      )}
    >
      {children}
    </button>
  );
}

function CarsContent({
  state,
  error,
  cars,
  hasQuery,
  onDelete,
}: {
  state: Load;
  error: string | null;
  cars: CarListItem[];
  hasQuery: boolean;
  onDelete: (car: CarListItem) => void;
}) {
  if (state === "unconfigured") {
    return (
      <Notice
        tone="info"
        title="Connect Supabase to load cars"
        body="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server."
      />
    );
  }
  if (state === "error") {
    return (
      <Notice
        tone="error"
        title="Couldn't load cars"
        body={error ?? "Unknown error. Check that the schema has been applied."}
      />
    );
  }
  if (state === "loading" || state === "idle") {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]"
          >
            <div className="aspect-[16/9] animate-pulse bg-[var(--color-app)]" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-app)]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-app)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return hasQuery ? (
      <Notice
        tone="info"
        title="No matches"
        body="No car matches that name or category. Try a different search."
      />
    ) : (
      <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-16 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-[var(--color-sky-100)] text-[var(--color-navy)]">
          <CarFront className="size-6" />
        </span>
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          No cars yet
        </h2>
        <p className="mt-1.5 max-w-xs text-sm text-[var(--color-ink-muted)]">
          Add your first car to start building the website&apos;s lineup.
        </p>
        <Link
          href="/cars/new"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-navy-700)]"
        >
          <Plus className="size-4" /> Add new car
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} onDelete={onDelete} />
      ))}
    </div>
  );
}

function Notice({
  tone,
  title,
  body,
}: {
  tone: "info" | "error";
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] border bg-[var(--color-surface)] px-5 py-4",
        tone === "error"
          ? "border-[var(--color-danger)]/30"
          : "border-[var(--color-line)]"
      )}
    >
      <AlertCircle
        className={cn(
          "mt-0.5 size-5 shrink-0",
          tone === "error"
            ? "text-[var(--color-danger)]"
            : "text-[var(--color-sky)]"
        )}
      />
      <div>
        <div className="font-medium text-[var(--color-ink)]">{title}</div>
        <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{body}</p>
      </div>
    </div>
  );
}
