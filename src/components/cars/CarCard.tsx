"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, ImageOff } from "lucide-react";
import type { CarListItem } from "@/types/db";
import { pick } from "@/lib/i18n";

export function CarCard({
  car,
  onDelete,
}: {
  car: CarListItem;
  onDelete: (car: CarListItem) => void;
}) {
  const name = car.name_en || pick(car, "name");
  const category = car.category ? pick(car.category, "name") : null;

  return (
    <div className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] transition-shadow hover:shadow-[0_2px_12px_rgba(0,44,95,0.08)]">
      {/* Hero image */}
      <div className="relative aspect-[16/9] bg-[var(--color-app)]">
        {car.hero_image ? (
          <Image
            src={car.hero_image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-[var(--color-ink-faint)]">
            <ImageOff className="size-6" />
            <span className="text-xs">No hero image</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--color-ink)]">
            {name}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-[var(--color-ink-muted)]">
            {category || "Uncategorized"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/cars/${car.id}/edit`}
            aria-label={`Edit ${name}`}
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-app)] hover:text-[var(--color-navy)]"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(car)}
            aria-label={`Delete ${name}`}
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
