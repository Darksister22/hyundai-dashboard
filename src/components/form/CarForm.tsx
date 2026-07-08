"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { pick } from "@/lib/i18n";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { submitCar, updateCar } from "@/lib/car-submit";
import { friendlyError } from "@/lib/errors";
import { validateCar } from "@/lib/car-validate";
import { useDialog } from "@/components/ui/dialog";
import { emptyCarForm, type CarFormState } from "@/types/car-form";
import type { Options, StepDef } from "./sections/_shared";

import { IdSection, HeroSection, OverviewSection } from "./sections/IdHeroOverview";
import {
  HighlightsSection,
  DesignSection,
  AdditionalDesignSection,
} from "./sections/HighlightsDesign";
import { VisualizerSection } from "./sections/Visualizer";
import {
  PerformanceSection,
  SafetySection,
  ConvenienceSection,
} from "./sections/PerformanceSafetyConvenience";
import { GallerySection } from "./sections/Gallery";

const STEPS: StepDef[] = [
  { id: "id", label: "ID", Component: IdSection },
  { id: "hero", label: "Hero", Component: HeroSection },
  { id: "overview", label: "Overview", Component: OverviewSection },
  { id: "highlights", label: "Highlights", Component: HighlightsSection },
  { id: "design", label: "Design", Component: DesignSection },
  { id: "additional", label: "Additional design", Component: AdditionalDesignSection },
  { id: "visualizer", label: "Visualizer", Component: VisualizerSection },
  { id: "performance", label: "Performance", Component: PerformanceSection },
  { id: "safety", label: "Safety", Component: SafetySection },
  { id: "convenience", label: "Convenience", Component: ConvenienceSection },
  { id: "gallery", label: "Gallery", Component: GallerySection },
];

const emptyOptions: Options = { categories: [], seating: [], drive: [] };

export function CarForm({
  mode = "create",
  initial,
}: {
  mode?: "create" | "edit";
  initial?: CarFormState;
} = {}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const isEdit = mode === "edit";
  const [state, setStateRaw] = useState<CarFormState>(
    () => initial ?? emptyCarForm()
  );
  const [dirty, setDirty] = useState(false);
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ friendly: string; raw: string } | null>(
    null
  );
  const [review, setReview] = useState<
    { id: string; label: string; issues: string[] }[] | null
  >(null);

  // Wrapped setter that marks the form dirty on any change.
  const set: typeof setStateRaw = (u) => {
    setDirty(true);
    setStateRaw(u);
  };

  const configured = isSupabaseConfigured();
  const validation = useMemo(() => validateCar(state), [state]);

  // Warn on browser/tab close while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Load the editable lists for the dropdowns.
  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [cats, seats, drives] = await Promise.all([
        supabase.from("categories").select("id,name_ar,name_en,name_ku").order("sort_order"),
        supabase.from("seating_options").select("id,label_ar,label_en,label_ku").order("sort_order"),
        supabase.from("drive_options").select("id,label_ar,label_en,label_ku").order("sort_order"),
      ]);
      if (cancelled) return;
      setOptions({
        categories: (cats.data ?? []).map((r) => ({ id: r.id, label: pick(r, "name") })),
        seating: (seats.data ?? []).map((r) => ({ id: r.id, label: pick(r, "label") })),
        drive: (drives.data ?? []).map((r) => ({ id: r.id, label: pick(r, "label") })),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const Active = STEPS[step].Component;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const stepId = STEPS[step].id;
  const canToggle = stepId !== "id";
  const sectionOn = canToggle
    ? state.sections[stepId as keyof typeof state.sections]
    : true;

  async function goBackToCars() {
    if (dirty) {
      const ok = await confirm({
        title: "Discard this car?",
        description: isEdit
          ? "Your unsaved changes will be lost."
          : "You'll lose the car you've been drafting — nothing has been uploaded yet.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        danger: true,
      });
      if (!ok) return;
    }
    router.push("/cars");
  }

  function startUpload() {
    setError(null);

    // Hard requirement: English name (the slug depends on it).
    if (!state.name.en.trim()) {
      setStep(0);
      setError({
        friendly: "Add the car's English name before uploading — the rest can follow.",
        raw: "",
      });
      return;
    }

    // Soft check: list every section that still looks incomplete.
    const incomplete = STEPS.map((s) => ({
      id: s.id,
      label: s.label,
      issues: validation[s.id]?.issues ?? [],
    })).filter((s) => s.issues.length > 0);

    if (incomplete.length > 0) {
      setReview(incomplete);
      return;
    }
    void doSubmit();
  }

  async function doSubmit() {
    setReview(null);
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) await updateCar(state);
      else await submitCar(state);
      setDirty(false);
      router.push("/cars");
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError({ friendly: friendlyError(raw), raw });
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar: back + section name */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 sm:px-6">
        <button
          type="button"
          onClick={goBackToCars}
          className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]"
          aria-label="Back to cars"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">
          {isEdit ? "Edit car" : "Add new car"}
        </h1>
      </header>

      <div className="flex flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Progress rail (desktop) */}
        <ProgressRail step={step} validation={validation} onJump={setStep} />

        <div className="min-w-0 flex-1">
          <MobileStepSelect step={step} onJump={setStep} />

          {!configured ? (
            <Banner
              tone="info"
              text="Supabase isn't connected, so image uploads and saving won't work yet. Add your env vars and restart to enable them."
            />
          ) : null}
          {error ? (
            <Banner tone="error" text={error.friendly} detail={error.raw} />
          ) : null}

          {/* Active section */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
            <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-line)] pb-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Step {step + 1} of {STEPS.length}
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                  {STEPS[step].label}
                </h2>
              </div>
              {canToggle ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={sectionOn}
                  onClick={() =>
                    set((s) => ({
                      ...s,
                      sections: { ...s.sections, [stepId]: !sectionOn },
                    }))
                  }
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-ink-muted)]"
                >
                  {sectionOn ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                  {sectionOn ? "Shown on website" : "Hidden"}
                  <span
                    className={cn(
                      "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                      sectionOn
                        ? "bg-[var(--color-navy)]"
                        : "bg-[var(--color-line-strong)]"
                    )}
                  >
                    <span
                      className={cn(
                        "size-4 rounded-full bg-white transition-all",
                        sectionOn ? "ml-auto" : "ml-0"
                      )}
                    />
                  </span>
                </button>
              ) : null}
            </header>

            {canToggle && !sectionOn ? (
              <div className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-app)] px-4 py-3 text-[13px] text-[var(--color-ink-muted)]">
                <EyeOff className="mt-px size-4 shrink-0" />
                This section is hidden from the website. Its data is kept — turn
                it back on any time.
              </div>
            ) : null}

            <Active state={state} set={set} options={options} />
          </div>

          {/* Sticky action bar */}
          <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={isFirst}
                className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                <ChevronLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={isLast}
                className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                Next <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goBackToCars}
                className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-4 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={submitting || !configured}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-5 text-sm font-medium text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />{" "}
                    {isEdit ? "Saving…" : "Uploading…"}
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> {isEdit ? "Save changes" : "Upload"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {review ? (
        <ReviewDialog
          items={review}
          onJump={(i) => {
            const idx = STEPS.findIndex((s) => s.id === i);
            if (idx >= 0) setStep(idx);
            setReview(null);
          }}
          onClose={() => setReview(null)}
          onUploadAnyway={() => void doSubmit()}
        />
      ) : null}
    </div>
  );
}

/* ----------------------------- progress rail ----------------------------- */
function ProgressRail({
  step,
  validation,
  onJump,
}: {
  step: number;
  validation: ReturnType<typeof validateCar>;
  onJump: (i: number) => void;
}) {
  return (
    <nav className="sticky top-20 hidden h-fit w-56 shrink-0 lg:block">
      <ol className="relative">
        {STEPS.map((s, i) => {
          const status = validation[s.id]?.status ?? "empty";
          const isCurrent = i === step;
          const isComplete = status === "complete";
          const isHidden = status === "hidden";
          const reachable = i <= step; // forward only via the buttons below
          const notLast = i < STEPS.length - 1;

          return (
            <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
              {notLast ? (
                <span
                  className={cn(
                    "absolute left-[13px] top-7 -bottom-1 w-px",
                    i < step ? "bg-[var(--color-navy)]" : "bg-[var(--color-line)]"
                  )}
                />
              ) : null}

              <button
                type="button"
                onClick={() => reachable && onJump(i)}
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold transition-colors",
                  isCurrent
                    ? "bg-[var(--color-navy)] text-white ring-4 ring-[var(--color-sky-100)]"
                    : isComplete
                    ? "bg-[var(--color-ok)] text-white"
                    : isHidden
                    ? "bg-[var(--color-app)] text-[var(--color-ink-faint)]"
                    : "bg-[var(--color-line)] text-[var(--color-ink-muted)]",
                  reachable ? "cursor-pointer" : "cursor-default"
                )}
              >
                {isCurrent ? (
                  i + 1
                ) : isComplete ? (
                  <Check className="size-4" />
                ) : isHidden ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  i + 1
                )}
              </button>

              <button
                type="button"
                onClick={() => reachable && onJump(i)}
                disabled={!reachable}
                className={cn(
                  "pt-1 text-left text-sm transition-colors",
                  isCurrent
                    ? "font-semibold text-[var(--color-ink)]"
                    : isHidden
                    ? "text-[var(--color-ink-faint)]"
                    : reachable
                    ? "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    : "text-[var(--color-ink-faint)] cursor-default"
                )}
              >
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileStepSelect({
  step,
  onJump,
}: {
  step: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="mb-4 lg:hidden">
      <select
        value={step}
        onChange={(e) => onJump(Number(e.target.value))}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-ink)]"
      >
        {STEPS.map((s, i) => (
          <option key={s.id} value={i}>
            {i + 1}. {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------- review ------------------------------- */
function ReviewDialog({
  items,
  onJump,
  onClose,
  onUploadAnyway,
}: {
  items: { id: string; label: string; issues: string[] }[];
  onJump: (id: string) => void;
  onClose: () => void;
  onUploadAnyway: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-start gap-3 border-b border-[var(--color-line)] px-6 py-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#b7791f]" />
          <div>
            <h3 className="font-semibold text-[var(--color-ink)]">
              Some sections look incomplete
            </h3>
            <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
              These are missing English text or images. You can fix them or
              upload anyway.
            </p>
          </div>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-6 py-4">
          {items.map((it) => (
            <div key={it.id}>
              <button
                type="button"
                onClick={() => onJump(it.id)}
                className="text-sm font-semibold text-[var(--color-navy)] hover:underline"
              >
                {it.label}
              </button>
              <ul className="mt-1 list-disc pl-5 text-[13px] text-[var(--color-ink-muted)]">
                {it.issues.map((issue, k) => (
                  <li key={k}>{issue}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] bg-[var(--color-app)] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-4 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onUploadAnyway}
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--color-navy)] px-5 text-sm font-medium text-white hover:bg-[var(--color-navy-700)]"
          >
            Upload anyway
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- banner ------------------------------- */
function Banner({
  tone,
  text,
  detail,
}: {
  tone: "info" | "error";
  text: string;
  detail?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        tone === "error"
          ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-50)] text-[var(--color-danger)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]"
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-px size-5 shrink-0" />
        <span>{text}</span>
      </div>
      {detail ? (
        <details className="mt-1.5 pl-7 text-xs opacity-80">
          <summary className="cursor-pointer">Technical details</summary>
          <code className="mt-1 block break-words">{detail}</code>
        </details>
      ) : null}
    </div>
  );
}
