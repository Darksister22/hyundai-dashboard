"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import {
  TriField,
  ImageUpload,
  CardShell,
  AddButton,
  SubBlock,
  Field,
} from "../primitives";
import {
  newSpinColor,
  new360Color,
  SPIN_FRAME_COUNT,
  type SpinColor,
} from "@/types/car-form";
import { uploadImage } from "@/lib/upload";
import { move, removeAt, replaceAt, type SectionProps } from "./_shared";

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pick color"
        className="size-10 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-1"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Color hex"
        className="h-10 w-28 rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm uppercase text-[var(--color-ink)] focus:border-[var(--color-sky)]"
      />
    </div>
  );
}

/* ---- 36-frame uploader for one spin color ---- */
function SpinFrames({
  carId,
  color,
  onChange,
}: {
  carId: string;
  color: SpinColor;
  onChange: (next: SpinColor) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filled = color.frames.filter(Boolean).length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .slice(0, SPIN_FRAME_COUNT);

    setError(null);
    const frames = color.frames.slice();
    const token =
      Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try {
      for (let i = 0; i < list.length; i++) {
        setProgress(i + 1);
        const idx = String(i + 1).padStart(2, "0");
        const url = await uploadImage(
          list[i],
          `cars/${carId}/visualizer/spin/${color.key}/frame-${idx}-${token}`
        );
        frames[i] = url;
        onChange({ ...color, frames: frames.slice() });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-[var(--color-ink)]">
          Frames{" "}
          <span
            className={
              filled === SPIN_FRAME_COUNT
                ? "text-[var(--color-ok)]"
                : "text-[var(--color-ink-faint)]"
            }
          >
            {filled}/{SPIN_FRAME_COUNT}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-app)] disabled:opacity-50"
          >
            {progress !== null ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> {progress}/
                {SPIN_FRAME_COUNT}
              </>
            ) : (
              <>Upload 36 frames</>
            )}
          </button>
          {filled > 0 ? (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...color,
                  frames: Array<string | null>(SPIN_FRAME_COUNT).fill(null),
                })
              }
              className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[var(--color-ink-muted)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]"
              aria-label="Clear frames"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 lg:grid-cols-12">
        {color.frames.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-app)]"
            title={`Frame ${i + 1}`}
          >
            {src ? (
              <Image src={src} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-[10px] text-[var(--color-ink-faint)]">
                {i + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">
        Select all 36 at once — they&apos;re ordered by filename.
      </p>
      {error ? (
        <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          e.target.value = "";
          handleFiles(files);
        }}
      />
    </div>
  );
}

export function VisualizerSection({ state, set }: SectionProps) {
  const spin = state.visualizer.spin;
  const setSpin = (next: SpinColor[]) =>
    set((s) => ({ ...s, visualizer: { ...s.visualizer, spin: next } }));

  const tsixty = state.visualizer.threeSixty;
  const setTsixty = (next: typeof tsixty) =>
    set((s) => ({ ...s, visualizer: { ...s.visualizer, threeSixty: next } }));

  return (
    <div className="space-y-8">
      {/* SPIN */}
      <SubBlock
        title="Spin"
        description="Each color is a 36-frame drag-to-spin sequence."
      >
        <div className="space-y-4">
          {spin.map((color, i) => (
            <CardShell
              key={color.key}
              title={`Spin color ${i + 1}`}
              index={i}
              total={spin.length}
              onMoveUp={() => setSpin(move(spin, i, -1))}
              onMoveDown={() => setSpin(move(spin, i, 1))}
              onRemove={() => setSpin(removeAt(spin, i))}
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                  <Field label="Color">
                    <ColorPicker
                      value={color.colorHex}
                      onChange={(colorHex) =>
                        setSpin(replaceAt(spin, i, { ...color, colorHex }))
                      }
                    />
                  </Field>
                  <TriField
                    label="Color name"
                    value={color.colorName}
                    onChange={(colorName) =>
                      setSpin(replaceAt(spin, i, { ...color, colorName }))
                    }
                    placeholder="e.g. Phantom Black"
                  />
                </div>
                <SpinFrames
                  carId={state.id}
                  color={color}
                  onChange={(next) => setSpin(replaceAt(spin, i, next))}
                />
              </div>
            </CardShell>
          ))}
          <AddButton
            label="Add spin color"
            onClick={() => setSpin([...spin, newSpinColor()])}
          />
        </div>
      </SubBlock>

      {/* 360 */}
      <SubBlock
        title="360"
        description="Each color is one equirectangular (2:1) panorama image."
      >
        <div className="space-y-4">
          {tsixty.map((color, i) => (
            <CardShell
              key={color.key}
              title={`360 color ${i + 1}`}
              index={i}
              total={tsixty.length}
              onMoveUp={() => setTsixty(move(tsixty, i, -1))}
              onMoveDown={() => setTsixty(move(tsixty, i, 1))}
              onRemove={() => setTsixty(removeAt(tsixty, i))}
            >
              <div className="grid gap-5 md:grid-cols-[260px_1fr]">
                <Field label="Panorama image" hint="2:1 equirectangular.">
                  <ImageUpload
                    value={color.image}
                    onChange={(image) =>
                      setTsixty(replaceAt(tsixty, i, { ...color, image }))
                    }
                    path={`cars/${state.id}/visualizer/360/${color.key}`}
                  />
                </Field>
                <div className="space-y-4">
                  <Field label="Color">
                    <ColorPicker
                      value={color.colorHex}
                      onChange={(colorHex) =>
                        setTsixty(replaceAt(tsixty, i, { ...color, colorHex }))
                      }
                    />
                  </Field>
                  <TriField
                    label="Color name"
                    value={color.colorName}
                    onChange={(colorName) =>
                      setTsixty(replaceAt(tsixty, i, { ...color, colorName }))
                    }
                  />
                </div>
              </div>
            </CardShell>
          ))}
          <AddButton
            label="Add 360 color"
            onClick={() => setTsixty([...tsixty, new360Color()])}
          />
        </div>
      </SubBlock>
    </div>
  );
}
