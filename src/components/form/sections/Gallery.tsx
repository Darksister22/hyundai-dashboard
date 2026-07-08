"use client";

import { ImageUpload, AddButton } from "../primitives";
import { newGalleryItem } from "@/types/car-form";
import { move, removeAt, replaceAt, type SectionProps } from "./_shared";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";

export function GallerySection({ state, set }: SectionProps) {
  const items = state.gallery;
  const setItems = (next: typeof items) =>
    set((s) => ({ ...s, gallery: next }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-ink-muted)]">
        Add gallery images. Drag order isn&apos;t needed — use the arrows to
        reorder.
      </p>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.key} className="space-y-2">
              <ImageUpload
                value={item.image}
                onChange={(image) =>
                  setItems(replaceAt(items, i, { ...item, image }))
                }
                path={`cars/${state.id}/gallery/${item.key}`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-faint)]">
                  #{i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => setItems(move(items, i, -1))}
                    className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === items.length - 1}
                    onClick={() => setItems(move(items, i, 1))}
                    className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setItems(removeAt(items, i))}
                    className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <AddButton
        label="Add gallery image"
        onClick={() => setItems([...items, newGalleryItem()])}
      />
    </div>
  );
}
