"use client";

import {
  Field,
  TriField,
  ImageUpload,
  CardShell,
  AddButton,
  SubBlock,
} from "../primitives";
import { newCard, type CardItem } from "@/types/car-form";
import { move, removeAt, replaceAt, type SectionProps } from "./_shared";
import { pick } from "@/lib/i18n";

/* =================================================== PERFORMANCE */
export function PerformanceSection({ state, set }: SectionProps) {
  const specLine = [
    pick(triRow("engine", state.specs.engine), "engine"),
    pick(triRow("max_power", state.specs.maxPower), "max_power"),
    pick(triRow("max_torque", state.specs.maxTorque), "max_torque"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Hero image">
          <ImageUpload
            value={state.performance.heroImage}
            onChange={(heroImage) =>
              set((s) => ({
                ...s,
                performance: { ...s.performance, heroImage },
              }))
            }
            path={`cars/${state.id}/performance/hero`}
          />
        </Field>
        <Field label="Closing image">
          <ImageUpload
            value={state.performance.closingImage}
            onChange={(closingImage) =>
              set((s) => ({
                ...s,
                performance: { ...s.performance, closingImage },
              }))
            }
            path={`cars/${state.id}/performance/closing`}
          />
        </Field>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-app)] px-4 py-3 text-[13px] text-[var(--color-ink-muted)]">
        Engine, max power and max torque come from{" "}
        <span className="font-medium text-[var(--color-ink)]">
          Overview → Specs
        </span>
        {specLine ? (
          <>
            {" "}
            (currently:{" "}
            <span className="text-[var(--color-ink)]">{specLine}</span>)
          </>
        ) : null}
        .
      </div>

      <TriField
        label="Transmission"
        value={state.performance.transmission}
        onChange={(transmission) =>
          set((s) => ({ ...s, performance: { ...s.performance, transmission } }))
        }
        placeholder="e.g. 8-speed automatic"
      />
      <TriField
        label="0–100 km/h"
        value={state.performance.accel0100}
        onChange={(accel0100) =>
          set((s) => ({ ...s, performance: { ...s.performance, accel0100 } }))
        }
        placeholder="e.g. 9.2 s"
      />
    </div>
  );
}

// tiny helper so we can reuse pick() over a Tri for the read-only spec line
function triRow(base: string, t: { ar: string; en: string; ku: string }) {
  return {
    [`${base}_ar`]: t.ar || null,
    [`${base}_en`]: t.en || null,
    [`${base}_ku`]: t.ku || null,
  };
}

/* ================================================ card list (shared) */
function CardList({
  carId,
  pathSeg,
  items,
  setItems,
  addLabel,
}: {
  carId: string;
  pathSeg: string;
  items: CardItem[];
  setItems: (next: CardItem[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <CardShell
          key={item.key}
          title={`Card ${i + 1}`}
          index={i}
          total={items.length}
          onMoveUp={() => setItems(move(items, i, -1))}
          onMoveDown={() => setItems(move(items, i, 1))}
          onRemove={() => setItems(removeAt(items, i))}
        >
          <div className="grid gap-5 md:grid-cols-[260px_1fr]">
            <Field label="Image">
              <ImageUpload
                value={item.image}
                onChange={(image) =>
                  setItems(replaceAt(items, i, { ...item, image }))
                }
                path={`cars/${carId}/${pathSeg}/${item.key}`}
              />
            </Field>
            <div className="space-y-4">
              <TriField
                label="Title"
                value={item.title}
                onChange={(title) =>
                  setItems(replaceAt(items, i, { ...item, title }))
                }
              />
              <TriField
                label="Description"
                multiline
                value={item.description}
                onChange={(description) =>
                  setItems(replaceAt(items, i, { ...item, description }))
                }
              />
            </div>
          </div>
        </CardShell>
      ))}
      <AddButton label={addLabel} onClick={() => setItems([...items, newCard()])} />
    </div>
  );
}

/* ========================================================= SAFETY */
export function SafetySection({ state, set }: SectionProps) {
  return (
    <div className="space-y-6">
      <TriField
        label="Heading"
        value={state.safety.heading}
        onChange={(heading) =>
          set((s) => ({ ...s, safety: { ...s.safety, heading } }))
        }
      />
      <CardList
        carId={state.id}
        pathSeg="safety"
        items={state.safety.cards}
        setItems={(cards) =>
          set((s) => ({ ...s, safety: { ...s.safety, cards } }))
        }
        addLabel="Add safety card"
      />
    </div>
  );
}

/* ==================================================== CONVENIENCE */
export function ConvenienceSection({ state, set }: SectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <TriField
          label="Heading"
          value={state.convenience.heading}
          onChange={(heading) =>
            set((s) => ({
              ...s,
              convenience: { ...s.convenience, heading },
            }))
          }
        />
        <Field label="Section image">
          <ImageUpload
            value={state.convenience.image}
            onChange={(image) =>
              set((s) => ({ ...s, convenience: { ...s.convenience, image } }))
            }
            path={`cars/${state.id}/convenience/main`}
            className="max-w-md"
          />
        </Field>
      </div>
      <CardList
        carId={state.id}
        pathSeg="convenience"
        items={state.convenience.cards}
        setItems={(cards) =>
          set((s) => ({ ...s, convenience: { ...s.convenience, cards } }))
        }
        addLabel="Add convenience card"
      />
    </div>
  );
}
