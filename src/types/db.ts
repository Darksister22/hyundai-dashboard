// =====================================================================
// Database row types — mirror supabase/schema.sql.
// Hand-written for now; once the schema is live you can regenerate the
// full typed Database with:  supabase gen types typescript ...
// =====================================================================

export type Lang = "ar" | "en" | "ku";
export const LANGS: Lang[] = ["ar", "en", "ku"];

// ---- Editable lists -------------------------------------------------
export interface Category {
  id: number;
  name_ar: string | null;
  name_en: string;
  name_ku: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SeatingOption {
  id: number;
  label_ar: string | null;
  label_en: string;
  label_ku: string | null;
  value: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DriveOption {
  id: number;
  label_ar: string | null;
  label_en: string;
  label_ku: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---- Core car (wide row) -------------------------------------------
export interface CarRow {
  id: string;
  slug: string;
  sort_order: number;
  feat_hero: boolean; feat_overview: boolean; feat_highlights: boolean;
  feat_design: boolean; feat_additional: boolean; feat_visualizer: boolean;
  feat_performance: boolean; feat_safety: boolean; feat_convenience: boolean;
  feat_gallery: boolean;
  created_at: string;
  updated_at: string;

  name_ar: string | null;
  name_en: string;
  name_ku: string | null;
  category_id: number | null;

  hero_image: string | null;
  hero_headline_ar: string | null;
  hero_headline_en: string | null;
  hero_headline_ku: string | null;

  overview_headline_ar: string | null;
  overview_headline_en: string | null;
  overview_headline_ku: string | null;
  overview_tagline_ar: string | null;
  overview_tagline_en: string | null;
  overview_tagline_ku: string | null;
  seating_id: number | null;
  drive_id: number | null;

  engine_ar: string | null; engine_en: string | null; engine_ku: string | null;
  max_power_ar: string | null; max_power_en: string | null; max_power_ku: string | null;
  max_torque_ar: string | null; max_torque_en: string | null; max_torque_ku: string | null;

  design_title_ar: string | null; design_title_en: string | null; design_title_ku: string | null;
  design_hero_image: string | null;
  additional_design_heading_ar: string | null; additional_design_heading_en: string | null; additional_design_heading_ku: string | null;

  perf_hero_image: string | null;
  transmission_ar: string | null; transmission_en: string | null; transmission_ku: string | null;
  accel_0_100_ar: string | null; accel_0_100_en: string | null; accel_0_100_ku: string | null;
  perf_closing_image: string | null;

  safety_heading_ar: string | null; safety_heading_en: string | null; safety_heading_ku: string | null;

  convenience_heading_ar: string | null; convenience_heading_en: string | null; convenience_heading_ku: string | null;
  convenience_image: string | null;
}

// ---- Collections ----------------------------------------------------
export interface HighlightCard {
  id: number; car_id: string; sort_order: number;
  title_ar: string | null; title_en: string | null; title_ku: string | null;
  description_ar: string | null; description_en: string | null; description_ku: string | null;
  image: string | null;
}

export interface DesignCard {
  id: number; car_id: string; kind: "exterior" | "interior"; sort_order: number;
  caption_ar: string | null; caption_en: string | null; caption_ku: string | null;
  image: string | null;
}

export interface AdditionalDesignItem {
  id: number; car_id: string; sort_order: number;
  label_ar: string | null; label_en: string | null; label_ku: string | null;
  image: string | null;
}

export interface SafetyCard {
  id: number; car_id: string; sort_order: number;
  title_ar: string | null; title_en: string | null; title_ku: string | null;
  description_ar: string | null; description_en: string | null; description_ku: string | null;
  image: string | null;
}

export interface ConvenienceCard {
  id: number; car_id: string; sort_order: number;
  title_ar: string | null; title_en: string | null; title_ku: string | null;
  description_ar: string | null; description_en: string | null; description_ku: string | null;
  image: string | null;
}

export interface GalleryImage {
  id: number; car_id: string; sort_order: number; image: string | null;
}

export interface VisualizerSpinColor {
  id: number; car_id: string; sort_order: number; color_hex: string | null;
  color_name_ar: string | null; color_name_en: string | null; color_name_ku: string | null;
}

export interface VisualizerSpinFrame {
  id: number; spin_color_id: number; frame_index: number; image: string | null;
}

export interface Visualizer360Color {
  id: number; car_id: string; sort_order: number; color_hex: string | null;
  color_name_ar: string | null; color_name_en: string | null; color_name_ku: string | null;
  image: string | null;
}

// ---- Shape used by the cars list view (card grid) ------------------
export interface CarListItem {
  id: string;
  slug: string;
  name_ar: string | null;
  name_en: string;
  name_ku: string | null;
  hero_image: string | null;
  category: Pick<Category, "id" | "name_ar" | "name_en" | "name_ku"> | null;
}

// ---- Hero banners ---------------------------------------------------
export interface Banner {
  id: string;
  sort_order: number;
  title_ar: string | null;
  title_en: string | null;
  title_ku: string | null;
  tagline_ar: string | null;
  tagline_en: string | null;
  tagline_ku: string | null;
  media_type: "image" | "video";
  media_url: string | null;
  car_id: string | null;
  car?: {
    id: string;
    name_ar: string | null;
    name_en: string;
    name_ku: string | null;
  } | null;
}

// ---- Find us (locations) -------------------------------------------
export interface LocationRow {
  id: string;
  sort_order: number;
  province: string | null;
  city_ar: string | null;
  city_en: string | null;
  city_ku: string | null;
  landmark_ar: string | null;
  landmark_en: string | null;
  landmark_ku: string | null;
  map_url: string | null;
}

// ---- Contact submissions --------------------------------------------
export type ContactStatus = "new" | "in_progress" | "resolved";
export type ContactInquiry = "general" | "sales" | "service" | "complaint";

export interface ContactSubmission {
  id: string;
  created_at: string;
  gender: "male" | "female" | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  inquiry_type: ContactInquiry;
  comments: string | null;
  attachments: string[];
  consent_marketing: boolean;
  opted_out: boolean;
  privacy_ack: boolean;
  status: ContactStatus;
}
