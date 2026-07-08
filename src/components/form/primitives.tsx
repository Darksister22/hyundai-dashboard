"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  Loader2,
  X,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/upload";
import type { Tri } from "@/types/car-form";
import { LANG_LABELS, isRTL } from "@/lib/i18n";
import type { Lang } from "@/types/db";

const TRI_ORDER: Lang[] = ["en", "ar", "ku"];

/* --------------------------------------------------------------- Field */
export function Field({
  label,
  hint,
  required,
  children,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-[var(--color-ink)]">
          {label}
          {required ? (
            <span className="text-[var(--color-danger)]">*</span>
          ) : null}
        </span>
      ) : null}
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-sky)]";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} className={cn(inputBase, "h-10", props.className)} />;
}

/* --------------------------------------------- Trilingual text input */
export function TriField({
  label,
  value,
  onChange,
  multiline,
  required,
  placeholder,
}: {
  label: string;
  value: Tri;
  onChange: (next: Tri) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-[var(--color-ink)]">
        {label}
        {required ? <span className="text-[var(--color-danger)]">*</span> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {TRI_ORDER.map((lang) => {
          const common = {
            value: value[lang],
            dir: isRTL(lang) ? ("rtl" as const) : ("ltr" as const),
            placeholder: placeholder ?? LANG_LABELS[lang],
            "aria-label": `${label} (${LANG_LABELS[lang]})`,
            onChange: (
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => onChange({ ...value, [lang]: e.target.value }),
          };
          return (
            <div key={lang}>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                {LANG_LABELS[lang]}
                {lang === "en" && required ? " · required" : ""}
              </div>
              {multiline ? (
                <textarea
                  {...common}
                  rows={3}
                  className={cn(inputBase, "resize-y py-2 leading-relaxed")}
                />
              ) : (
                <input {...common} className={cn(inputBase, "h-10")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Select */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  emptyHint,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  options: { id: number; label: string }[];
  placeholder?: string;
  emptyHint?: string;
}) {
  if (options.length === 0 && emptyHint) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-app)] px-3 py-2.5 text-sm text-[var(--color-ink-muted)]">
        {emptyHint}
      </div>
    );
  }
  return (
    <select
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className={cn(inputBase, "h-10 pr-8")}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* -------------------------------------------------------- ImageUpload */
export function ImageUpload({
  value,
  onChange,
  path,
  hint,
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Storage path WITHOUT extension, e.g. cars/{id}/hero */
  path: string;
  hint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      // Unique suffix each upload so replacing never hits a cached URL and
      // re-picking after removing always shows the new image.
      const token =
        Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const url = await uploadImage(file, `${path}-${token}`);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-app)]",
          value && "border-solid"
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex flex-col items-center gap-1.5 px-4 text-center text-[var(--color-ink-muted)] hover:text-[var(--color-navy)]"
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImageIcon className="size-6" />
            )}
            <span className="text-[13px] font-medium">
              {busy ? "Uploading…" : "Upload image"}
            </span>
          </button>
        )}
        {value && busy ? (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <Loader2 className="size-6 animate-spin text-[var(--color-navy)]" />
          </div>
        ) : null}
      </div>

      {value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-sky)] hover:underline"
        >
          <Upload className="size-3.5" /> Replace
        </button>
      ) : null}

      {error ? (
        <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">{hint}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow re-selecting the same file
          handleFile(file);
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------- CardShell */
export function CardShell({
  title,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
}: {
  title: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[var(--color-ink)]">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn
            label="Move up"
            disabled={index === 0}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-4" />
          </IconBtn>
          <IconBtn
            label="Move down"
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-4" />
          </IconBtn>
          <IconBtn label="Remove" danger onClick={onRemove}>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>
      <div className="p-4">{children}</div>
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
      className={cn(
        "grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] transition-colors disabled:opacity-30",
        danger
          ? "hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]"
          : "hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------- AddButton */
export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
    >
      <Plus className="size-4" /> {label}
    </button>
  );
}

/* -------------------------------------------------------- Toggle */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <div>
        <div className="text-[13px] font-medium text-[var(--color-ink)]">
          {label}
        </div>
        {description ? (
          <div className="text-xs text-[var(--color-ink-muted)]">
            {description}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-[var(--color-navy)]" : "bg-[var(--color-line-strong)]"
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-white transition-all",
            checked ? "ml-auto" : "ml-0"
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------- SubBlock */
export function SubBlock({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {title ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            {title}
          </h3>
          {description ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
