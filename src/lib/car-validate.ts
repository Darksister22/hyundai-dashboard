import {
  SPIN_FRAME_COUNT,
  type CarFormState,
  type Tri,
} from "@/types/car-form";

export type StepStatus = "complete" | "partial" | "empty" | "hidden";

export interface StepValidation {
  status: StepStatus;
  issues: string[];
}

export type CarValidation = Record<string, StepValidation>;

const en = (t: Tri) => Boolean(t.en && t.en.trim());
const img = (v: string | null) => Boolean(v);

interface Check {
  ok: boolean;
  msg: string;
}

function summarize(checks: Check[]): StepValidation {
  const issues = checks.filter((c) => !c.ok).map((c) => c.msg);
  const filled = checks.length - issues.length;
  const status: StepStatus =
    filled === checks.length ? "complete" : filled === 0 ? "empty" : "partial";
  return { status, issues };
}

export function validateCar(s: CarFormState): CarValidation {
  const v: CarValidation = {};

  // ID
  v.id = summarize([
    { ok: en(s.name), msg: "Car name (English) is required" },
    { ok: s.categoryId != null, msg: "Select a category" },
  ]);

  // HERO
  v.hero = summarize([
    { ok: img(s.hero.image), msg: "Add a hero image" },
    { ok: en(s.hero.headline), msg: "Add the English hero headline" },
  ]);

  // OVERVIEW (+ shared specs)
  v.overview = summarize([
    { ok: en(s.overview.headline), msg: "English headline" },
    { ok: en(s.overview.tagline), msg: "English tagline" },
    { ok: s.overview.seatingId != null, msg: "Select seating" },
    { ok: s.overview.driveId != null, msg: "Select drive" },
    { ok: en(s.specs.engine), msg: "Engine (English)" },
    { ok: en(s.specs.maxPower), msg: "Max power (English)" },
    { ok: en(s.specs.maxTorque), msg: "Max torque (English)" },
  ]);

  // HIGHLIGHTS
  if (s.highlights.length === 0) {
    v.highlights = { status: "empty", issues: ["Add at least one highlight"] };
  } else {
    const checks: Check[] = [];
    s.highlights.forEach((h, i) => {
      checks.push({ ok: en(h.title), msg: `Highlight ${i + 1}: English title` });
      checks.push({ ok: img(h.image), msg: `Highlight ${i + 1}: image` });
    });
    v.highlights = summarize(checks);
  }

  // DESIGN
  {
    const checks: Check[] = [
      { ok: en(s.design.title), msg: "Design title (English)" },
      { ok: img(s.design.heroImage), msg: "Design hero image" },
    ];
    const cards = [
      ...s.design.exterior.map((c, i) => ({ c, label: `Exterior ${i + 1}` })),
      ...s.design.interior.map((c, i) => ({ c, label: `Interior ${i + 1}` })),
    ];
    if (cards.length === 0) {
      checks.push({ ok: false, msg: "Add at least one design card" });
    } else {
      cards.forEach(({ c, label }) => {
        checks.push({ ok: img(c.image), msg: `${label}: image` });
        checks.push({ ok: en(c.caption), msg: `${label}: English caption` });
      });
    }
    v.design = summarize(checks);
  }

  // ADDITIONAL DESIGN (3 fixed blocks)
  {
    const checks: Check[] = [
      { ok: en(s.additionalDesign.heading), msg: "Heading (English)" },
    ];
    s.additionalDesign.items.forEach((it, i) => {
      checks.push({ ok: en(it.label), msg: `Block ${i + 1}: English label` });
      checks.push({ ok: img(it.image), msg: `Block ${i + 1}: image` });
    });
    v.additional = summarize(checks);
  }

  // VISUALIZER
  if (s.visualizer.spin.length === 0 && s.visualizer.threeSixty.length === 0) {
    v.visualizer = { status: "empty", issues: ["Add a spin or 360 color"] };
  } else {
    const checks: Check[] = [];
    s.visualizer.spin.forEach((c, i) => {
      checks.push({ ok: en(c.colorName), msg: `Spin ${i + 1}: English color name` });
      checks.push({
        ok: c.frames.filter(Boolean).length === SPIN_FRAME_COUNT,
        msg: `Spin ${i + 1}: all ${SPIN_FRAME_COUNT} frames`,
      });
    });
    s.visualizer.threeSixty.forEach((c, i) => {
      checks.push({ ok: en(c.colorName), msg: `360 ${i + 1}: English color name` });
      checks.push({ ok: img(c.image), msg: `360 ${i + 1}: panorama image` });
    });
    v.visualizer = summarize(checks);
  }

  // PERFORMANCE
  v.performance = summarize([
    { ok: img(s.performance.heroImage), msg: "Hero image" },
    { ok: img(s.performance.closingImage), msg: "Closing image" },
    { ok: en(s.performance.transmission), msg: "Transmission (English)" },
    { ok: en(s.performance.accel0100), msg: "0–100 km/h (English)" },
  ]);

  // SAFETY
  {
    const checks: Check[] = [
      { ok: en(s.safety.heading), msg: "Heading (English)" },
    ];
    if (s.safety.cards.length === 0) {
      checks.push({ ok: false, msg: "Add at least one safety card" });
    } else {
      s.safety.cards.forEach((c, i) => {
        checks.push({ ok: en(c.title), msg: `Card ${i + 1}: English title` });
        checks.push({ ok: img(c.image), msg: `Card ${i + 1}: image` });
      });
    }
    v.safety = summarize(checks);
  }

  // CONVENIENCE
  {
    const checks: Check[] = [
      { ok: en(s.convenience.heading), msg: "Heading (English)" },
      { ok: img(s.convenience.image), msg: "Section image" },
    ];
    if (s.convenience.cards.length === 0) {
      checks.push({ ok: false, msg: "Add at least one convenience card" });
    } else {
      s.convenience.cards.forEach((c, i) => {
        checks.push({ ok: en(c.title), msg: `Card ${i + 1}: English title` });
        checks.push({ ok: img(c.image), msg: `Card ${i + 1}: image` });
      });
    }
    v.convenience = summarize(checks);
  }

  // GALLERY
  if (s.gallery.length === 0) {
    v.gallery = { status: "empty", issues: ["Add at least one image"] };
  } else {
    v.gallery = summarize(
      s.gallery.map((g, i) => ({ ok: img(g.image), msg: `Image ${i + 1}` }))
    );
  }

  // Sections turned off ("not featured") are hidden: no completeness nagging.
  for (const key of Object.keys(s.sections) as (keyof typeof s.sections)[]) {
    if (!s.sections[key]) v[key] = { status: "hidden", issues: [] };
  }

  return v;
}
