"use client";

import {
  Field,
  TriField,
  ImageUpload,
  CardShell,
  AddButton,
  SubBlock,
} from "../primitives";
import {
  newHighlight,
  newDesignCard,
  type DesignCardItem,
} from "@/types/car-form";
import { move, removeAt, replaceAt, type SectionProps } from "./_shared";

/* =================================================== HIGHLIGHTS */
export function HighlightsSection({ state, set }: SectionProps) {
  const items = state.highlights;
  const setItems = (next: typeof items) =>
    set((s) => ({ ...s, highlights: next }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-ink-muted)]">
        Add as many highlight cards as you need. Each has a title, description,
        and image.
      </p>

      {items.map((item, i) => (
        <CardShell
          key={item.key}
          title={`Highlight ${i + 1}`}
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
                path={`cars/${state.id}/highlights/${item.key}`}
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

      <AddButton
        label="Add highlight"
        onClick={() => setItems([...items, newHighlight()])}
      />
    </div>
  );
}

/* ======================================================= DESIGN */
function DesignCardList({
  state,
  set,
  kind,
}: SectionProps & { kind: "exterior" | "interior" }) {
  const items = state.design[kind];
  const setItems = (next: DesignCardItem[]) =>
    set((s) => ({ ...s, design: { ...s.design, [kind]: next } }));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <CardShell
          key={item.key}
          title={`${kind === "exterior" ? "Exterior" : "Interior"} ${i + 1}`}
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
                path={`cars/${state.id}/design/${kind}/${item.key}`}
              />
            </Field>
            <TriField
              label="Caption"
              value={item.caption}
              onChange={(caption) =>
                setItems(replaceAt(items, i, { ...item, caption }))
              }
            />
          </div>
        </CardShell>
      ))}
      <AddButton
        label={`Add ${kind} card`}
        onClick={() => setItems([...items, newDesignCard()])}
      />
    </div>
  );
}

export function DesignSection(props: SectionProps) {
  const { state, set } = props;
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <TriField
          label="Section title"
          value={state.design.title}
          onChange={(title) =>
            set((s) => ({ ...s, design: { ...s.design, title } }))
          }
        />
        <Field label="Design hero image">
          <ImageUpload
            value={state.design.heroImage}
            onChange={(heroImage) =>
              set((s) => ({ ...s, design: { ...s.design, heroImage } }))
            }
            path={`cars/${state.id}/design/hero`}
            className="max-w-md"
          />
        </Field>
      </div>

      <SubBlock title="Exterior" description="Cards shown in the exterior gallery.">
        <DesignCardList {...props} kind="exterior" />
      </SubBlock>

      <SubBlock title="Interior" description="Cards shown in the interior gallery.">
        <DesignCardList {...props} kind="interior" />
      </SubBlock>
    </div>
  );
}

/* ============================================ ADDITIONAL DESIGN */
export function AdditionalDesignSection({ state, set }: SectionProps) {
  const items = state.additionalDesign.items;
  const setItem = (i: number, next: (typeof items)[number]) =>
    set((s) => ({
      ...s,
      additionalDesign: {
        ...s.additionalDesign,
        items: replaceAt(s.additionalDesign.items, i, next),
      },
    }));

  return (
    <div className="space-y-6">
      <TriField
        label="Heading"
        value={state.additionalDesign.heading}
        onChange={(heading) =>
          set((s) => ({
            ...s,
            additionalDesign: { ...s.additionalDesign, heading },
          }))
        }
      />
      <p className="text-sm text-[var(--color-ink-muted)]">
        Three fixed blocks, each a label and an image.
      </p>
      <div className="grid gap-5 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={item.key}
            className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <div className="text-[13px] font-semibold text-[var(--color-ink)]">
              Block {i + 1}
            </div>
            <ImageUpload
              value={item.image}
              onChange={(image) => setItem(i, { ...item, image })}
              path={`cars/${state.id}/additional/${i + 1}`}
            />
            <TriField
              label="Label"
              value={item.label}
              onChange={(label) => setItem(i, { ...item, label })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
