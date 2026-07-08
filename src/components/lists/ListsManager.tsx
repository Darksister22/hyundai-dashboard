"use client";

import { useState } from "react";
import { Tags, Armchair, Cog, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ListEditor } from "./ListEditor";

type Which = "categories" | "seating" | "drive";

const TABS: { id: Which; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "categories", label: "Categories", icon: Tags },
  { id: "seating", label: "Seating", icon: Armchair },
  { id: "drive", label: "Drive", icon: Cog },
];

export function ListsManager() {
  const [which, setWhich] = useState<Which>("categories");

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--color-sky)]" />
        <div>
          <div className="font-medium text-[var(--color-ink)]">
            Connect Supabase to manage lists
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
            Add your environment variables and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      {/* sub-nav */}
      <nav className="flex gap-1 lg:flex-col">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setWhich(id)}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
              which === id
                ? "bg-[var(--color-sky-100)] text-[var(--color-navy)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]"
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </nav>

      {/* active editor */}
      <div className="max-w-2xl rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        {which === "categories" ? (
          <ListEditor
            key="categories"
            title="Categories"
            description="Car categories the website groups by (e.g. SUV, Sedan)."
            table="categories"
            base="name"
          />
        ) : null}
        {which === "seating" ? (
          <ListEditor
            key="seating"
            title="Seating options"
            description="Seating choices for the Overview dropdown."
            table="seating_options"
            base="label"
            hasValue
          />
        ) : null}
        {which === "drive" ? (
          <ListEditor
            key="drive"
            title="Drive options"
            description="Drivetrain choices for the Overview dropdown."
            table="drive_options"
            base="label"
          />
        ) : null}
      </div>
    </div>
  );
}
