"use client";

import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { removeUnreferenced } from "@/lib/storage";
import { BUCKET } from "@/lib/upload";
import type { CarFormState, Tri } from "@/types/car-form";

type Row = Record<string, unknown>;
type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

/** Expand a {ar,en,ku} trio into `<base>_ar/_en/_ku` columns (empty -> null). */
function tri(base: string, t: Tri): Row {
  const v = (s: string) => (s.trim() ? s.trim() : null);
  return {
    [`${base}_ar`]: v(t.ar),
    [`${base}_en`]: v(t.en),
    [`${base}_ku`]: v(t.ku),
  };
}

/** Find a slug not already taken, appending -2, -3, ... as needed. */
async function uniqueSlug(supabase: SupabaseClient, base: string): Promise<string> {
  const { data, error } = await supabase
    .from("cars")
    .select("slug")
    .like("slug", `${base}%`);
  if (error) throw error;
  const taken = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** All scalar car columns EXCEPT id and slug (those are handled separately). */
function carScalars(s: CarFormState): Row {
  return {
    category_id: s.categoryId,
    feat_hero: s.sections.hero,
    feat_overview: s.sections.overview,
    feat_highlights: s.sections.highlights,
    feat_design: s.sections.design,
    feat_additional: s.sections.additional,
    feat_visualizer: s.sections.visualizer,
    feat_performance: s.sections.performance,
    feat_safety: s.sections.safety,
    feat_convenience: s.sections.convenience,
    feat_gallery: s.sections.gallery,
    seating_id: s.overview.seatingId,
    drive_id: s.overview.driveId,
    ...tri("name", s.name),
    hero_image: s.hero.image,
    ...tri("hero_headline", s.hero.headline),
    ...tri("overview_headline", s.overview.headline),
    ...tri("overview_tagline", s.overview.tagline),
    ...tri("engine", s.specs.engine),
    ...tri("max_power", s.specs.maxPower),
    ...tri("max_torque", s.specs.maxTorque),
    ...tri("design_title", s.design.title),
    design_hero_image: s.design.heroImage,
    ...tri("additional_design_heading", s.additionalDesign.heading),
    perf_hero_image: s.performance.heroImage,
    ...tri("transmission", s.performance.transmission),
    ...tri("accel_0_100", s.performance.accel0100),
    perf_closing_image: s.performance.closingImage,
    ...tri("safety_heading", s.safety.heading),
    ...tri("convenience_heading", s.convenience.heading),
    convenience_image: s.convenience.image,
  };
}

/* ---------------------------------------------------------------------
 * Storage garbage collection (runs after a successful save)
 * ------------------------------------------------------------------- */

/** Every media URL the form state still references. */
function collectCarUrls(s: CarFormState): (string | null)[] {
  return [
    s.hero.image,
    s.design.heroImage,
    s.performance.heroImage,
    s.performance.closingImage,
    s.convenience.image,
    ...s.highlights.map((h) => h.image),
    ...s.design.exterior.map((c) => c.image),
    ...s.design.interior.map((c) => c.image),
    ...s.additionalDesign.items.map((it) => it.image),
    ...s.safety.cards.map((c) => c.image),
    ...s.convenience.cards.map((c) => c.image),
    ...s.gallery.map((g) => g.image),
    ...s.visualizer.threeSixty.map((c) => c.image),
    ...s.visualizer.spin.flatMap((c) => c.frames),
  ];
}

/**
 * Delete every file under cars/{id}/ that the saved state no longer
 * references (replaced heroes, re-uploaded frame sets, removed cards...).
 * Best-effort: a cleanup failure must never fail the save — but it is
 * logged, never swallowed silently.
 */
async function gcCarStorage(supabase: SupabaseClient, s: CarFormState) {
  try {
    const removed = await removeUnreferenced(
      supabase,
      BUCKET,
      `cars/${s.id}`,
      collectCarUrls(s)
    );
    if (removed > 0) console.info(`[car-submit] storage GC removed ${removed} stale file(s)`);
  } catch (e) {
    console.warn("[car-submit] storage GC failed (save succeeded):", e);
  }
}

async function insertRows(supabase: SupabaseClient, table: string, rows: Row[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
}

const CHILD_TABLES = [
  "highlight_cards",
  "design_cards",
  "additional_design_items",
  "safety_cards",
  "convenience_cards",
  "gallery_images",
  "visualizer_360_colors",
  "visualizer_spin_colors", // cascades to visualizer_spin_frames
];

async function deleteChildren(supabase: SupabaseClient, carId: string) {
  for (const t of CHILD_TABLES) {
    const { error } = await supabase.from(t).delete().eq("car_id", carId);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
}

/** Insert every child collection for a car from the form state. */
async function insertChildren(supabase: SupabaseClient, s: CarFormState) {
  const carId = s.id;

  await insertRows(
    supabase,
    "highlight_cards",
    s.highlights.map((h, i) => ({
      car_id: carId,
      sort_order: i,
      ...tri("title", h.title),
      ...tri("description", h.description),
      image: h.image,
    }))
  );

  await insertRows(supabase, "design_cards", [
    ...s.design.exterior.map((c, i) => ({
      car_id: carId,
      kind: "exterior",
      sort_order: i,
      ...tri("caption", c.caption),
      image: c.image,
    })),
    ...s.design.interior.map((c, i) => ({
      car_id: carId,
      kind: "interior",
      sort_order: i,
      ...tri("caption", c.caption),
      image: c.image,
    })),
  ]);

  await insertRows(
    supabase,
    "additional_design_items",
    s.additionalDesign.items.map((it, i) => ({
      car_id: carId,
      sort_order: i,
      ...tri("label", it.label),
      image: it.image,
    }))
  );

  await insertRows(
    supabase,
    "safety_cards",
    s.safety.cards.map((c, i) => ({
      car_id: carId,
      sort_order: i,
      ...tri("title", c.title),
      ...tri("description", c.description),
      image: c.image,
    }))
  );

  await insertRows(
    supabase,
    "convenience_cards",
    s.convenience.cards.map((c, i) => ({
      car_id: carId,
      sort_order: i,
      ...tri("title", c.title),
      ...tri("description", c.description),
      image: c.image,
    }))
  );

  await insertRows(
    supabase,
    "gallery_images",
    s.gallery
      .filter((g) => g.image)
      .map((g, i) => ({ car_id: carId, sort_order: i, image: g.image }))
  );

  await insertRows(
    supabase,
    "visualizer_360_colors",
    s.visualizer.threeSixty.map((c, i) => ({
      car_id: carId,
      sort_order: i,
      color_hex: c.colorHex,
      ...tri("color_name", c.colorName),
      image: c.image,
    }))
  );

  for (let i = 0; i < s.visualizer.spin.length; i++) {
    const color = s.visualizer.spin[i];
    const { data, error } = await supabase
      .from("visualizer_spin_colors")
      .insert({
        car_id: carId,
        sort_order: i,
        color_hex: color.colorHex,
        ...tri("color_name", color.colorName),
      })
      .select("id")
      .single();
    if (error) throw new Error(`visualizer_spin_colors: ${error.message}`);

    const frames = color.frames
      .map((img, idx) => ({
        spin_color_id: (data as { id: number }).id,
        frame_index: idx + 1,
        image: img,
      }))
      .filter((f) => f.image);
    await insertRows(supabase, "visualizer_spin_frames", frames);
  }
}

/**
 * Create a new car + all child rows. Images were uploaded as they were picked.
 *
 * NOTE: no surrounding transaction yet — a mid-way failure can leave partial
 * data. We'll move this into a Postgres function (RPC) later.
 */
export async function submitCar(s: CarFormState): Promise<{ slug: string }> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const base = slugify(s.name.en);
  if (!base) throw new Error("An English name is required (the slug is built from it).");
  const slug = await uniqueSlug(supabase, base);

  const { error: carErr } = await supabase
    .from("cars")
    .insert({ id: s.id, slug, ...carScalars(s) });
  if (carErr) throw new Error(`cars: ${carErr.message}`);

  await insertChildren(supabase, s);
  await gcCarStorage(supabase, s);
  return { slug };
}

/**
 * Update an existing car. The slug is kept stable (the website links to it).
 * Children are replaced wholesale: delete all, then re-insert from state.
 *
 * Same transaction caveat as submitCar.
 */
export async function updateCar(s: CarFormState): Promise<{ id: string }> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const { error: carErr } = await supabase
    .from("cars")
    .update(carScalars(s))
    .eq("id", s.id);
  if (carErr) throw new Error(`cars: ${carErr.message}`);

  await deleteChildren(supabase, s.id);
  await insertChildren(supabase, s);
  await gcCarStorage(supabase, s);
  return { id: s.id };
}