import type { SupabaseClient } from "@supabase/supabase-js";
import { uuidv4 } from "@/lib/uuid";
import {
  SPIN_FRAME_COUNT,
  emptyTri,
  type CarFormState,
  type Tri,
} from "@/types/car-form";

type R = Record<string, unknown>;

const str = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number | null =>
  v == null ? null : Number(v as number);

function triFrom(r: R, base: string): Tri {
  const g = (l: string) => ((r[`${base}_${l}`] as string | null) ?? "");
  return { ar: g("ar"), en: g("en"), ku: g("ku") };
}

/**
 * Fetch a car and every child collection, mapped into the same shape the form
 * uses. Returns null if the car doesn't exist. Each repeatable item gets a
 * fresh client key (used for React keys + new-image storage paths).
 */
export async function loadCarForm(
  supabase: SupabaseClient,
  id: string
): Promise<CarFormState | null> {
  const { data: car, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !car) return null;
  const c = car as R;

  const [hl, dc, ad, sf, cv, gl, spin, t360] = await Promise.all([
    supabase.from("highlight_cards").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("design_cards").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("additional_design_items").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("safety_cards").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("convenience_cards").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("gallery_images").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("visualizer_spin_colors").select("*").eq("car_id", id).order("sort_order"),
    supabase.from("visualizer_360_colors").select("*").eq("car_id", id).order("sort_order"),
  ]);

  const spinColors = (spin.data ?? []) as R[];

  // Frames for all spin colors in one query, grouped by color id.
  const framesByColor: Record<number, (string | null)[]> = {};
  for (const sc of spinColors) {
    framesByColor[sc.id as number] = Array<string | null>(SPIN_FRAME_COUNT).fill(null);
  }
  if (spinColors.length) {
    const { data: frames } = await supabase
      .from("visualizer_spin_frames")
      .select("*")
      .in("spin_color_id", spinColors.map((sc) => sc.id as number))
      .order("frame_index");
    for (const f of (frames ?? []) as R[]) {
      const arr = framesByColor[f.spin_color_id as number];
      const idx = (f.frame_index as number) - 1;
      if (arr && idx >= 0 && idx < SPIN_FRAME_COUNT) arr[idx] = str(f.image);
    }
  }

  const design = (dc.data ?? []) as R[];
  const additional = (ad.data ?? []) as R[];

  // Additional design is exactly 3 blocks; pad if the row has fewer.
  const additionalItems = additional.map((r) => ({
    key: uuidv4(),
    label: triFrom(r, "label"),
    image: str(r.image),
  }));
  while (additionalItems.length < 3) {
    additionalItems.push({ key: uuidv4(), label: emptyTri(), image: null });
  }

  return {
    id: String(car.id),
    name: triFrom(c, "name"),
    categoryId: num(c.category_id),
    sections: {
      hero: c.feat_hero !== false,
      overview: c.feat_overview !== false,
      highlights: c.feat_highlights !== false,
      design: c.feat_design !== false,
      additional: c.feat_additional !== false,
      visualizer: c.feat_visualizer !== false,
      performance: c.feat_performance !== false,
      safety: c.feat_safety !== false,
      convenience: c.feat_convenience !== false,
      gallery: c.feat_gallery !== false,
    },

    hero: { image: str(c.hero_image), headline: triFrom(c, "hero_headline") },

    overview: {
      headline: triFrom(c, "overview_headline"),
      tagline: triFrom(c, "overview_tagline"),
      seatingId: num(c.seating_id),
      driveId: num(c.drive_id),
    },

    specs: {
      engine: triFrom(c, "engine"),
      maxPower: triFrom(c, "max_power"),
      maxTorque: triFrom(c, "max_torque"),
    },

    design: {
      title: triFrom(c, "design_title"),
      heroImage: str(c.design_hero_image),
      exterior: design
        .filter((r) => r.kind === "exterior")
        .map((r) => ({ key: uuidv4(), caption: triFrom(r, "caption"), image: str(r.image) })),
      interior: design
        .filter((r) => r.kind === "interior")
        .map((r) => ({ key: uuidv4(), caption: triFrom(r, "caption"), image: str(r.image) })),
    },

    additionalDesign: {
      heading: triFrom(c, "additional_design_heading"),
      items: additionalItems.slice(0, 3),
    },

    visualizer: {
      spin: spinColors.map((r) => ({
        key: uuidv4(),
        colorHex: (str(r.color_hex) as string) || "#1a1d21",
        colorName: triFrom(r, "color_name"),
        frames: framesByColor[r.id as number] ?? Array<string | null>(SPIN_FRAME_COUNT).fill(null),
      })),
      threeSixty: ((t360.data ?? []) as R[]).map((r) => ({
        key: uuidv4(),
        colorHex: (str(r.color_hex) as string) || "#1a1d21",
        colorName: triFrom(r, "color_name"),
        image: str(r.image),
      })),
    },

    performance: {
      heroImage: str(c.perf_hero_image),
      transmission: triFrom(c, "transmission"),
      accel0100: triFrom(c, "accel_0_100"),
      closingImage: str(c.perf_closing_image),
    },

    safety: {
      heading: triFrom(c, "safety_heading"),
      cards: ((sf.data ?? []) as R[]).map((r) => ({
        key: uuidv4(),
        title: triFrom(r, "title"),
        description: triFrom(r, "description"),
        image: str(r.image),
      })),
    },

    convenience: {
      heading: triFrom(c, "convenience_heading"),
      image: str(c.convenience_image),
      cards: ((cv.data ?? []) as R[]).map((r) => ({
        key: uuidv4(),
        title: triFrom(r, "title"),
        description: triFrom(r, "description"),
        image: str(r.image),
      })),
    },

    gallery: ((gl.data ?? []) as R[]).map((r) => ({
      key: uuidv4(),
      image: str(r.image),
    })),

    highlights: ((hl.data ?? []) as R[]).map((r) => ({
      key: uuidv4(),
      title: triFrom(r, "title"),
      description: triFrom(r, "description"),
      image: str(r.image),
    })),
  };
}
