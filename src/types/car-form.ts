// =====================================================================
// Client-side shape of the Add/Edit car form. Mirrors the DB but uses
// {ar,en,ku} trios and client-local `key`s for repeatable items (used for
// React keys and Storage sub-paths before rows exist in the DB).
// =====================================================================

export interface Tri {
  ar: string;
  en: string;
  ku: string;
}

export const emptyTri = (): Tri => ({ ar: "", en: "", ku: "" });

export interface HighlightItem {
  key: string;
  title: Tri;
  description: Tri;
  image: string | null;
}

export interface DesignCardItem {
  key: string;
  caption: Tri;
  image: string | null;
}

export interface AdditionalItem {
  key: string;
  label: Tri;
  image: string | null;
}

export interface CardItem {
  key: string;
  title: Tri;
  description: Tri;
  image: string | null;
}

export interface GalleryItem {
  key: string;
  image: string | null;
}

export interface SpinColor {
  key: string;
  colorHex: string;
  colorName: Tri;
  /** 36 slots; index = frame order. null = not uploaded yet. */
  frames: (string | null)[];
}

export interface ThreeSixtyColor {
  key: string;
  colorHex: string;
  colorName: Tri;
  image: string | null;
}

/** Per-section "show on website" flags. Keys match the form step ids. */
export interface SectionFlags {
  hero: boolean;
  overview: boolean;
  highlights: boolean;
  design: boolean;
  additional: boolean;
  visualizer: boolean;
  performance: boolean;
  safety: boolean;
  convenience: boolean;
  gallery: boolean;
}

export const TOGGLEABLE_SECTIONS: (keyof SectionFlags)[] = [
  "hero",
  "overview",
  "highlights",
  "design",
  "additional",
  "visualizer",
  "performance",
  "safety",
  "convenience",
  "gallery",
];

export function allSectionsOn(): SectionFlags {
  return {
    hero: true,
    overview: true,
    highlights: true,
    design: true,
    additional: true,
    visualizer: true,
    performance: true,
    safety: true,
    convenience: true,
    gallery: true,
  };
}

export interface CarFormState {
  id: string; // pre-generated UUID; Storage paths use it
  name: Tri;
  categoryId: number | null;
  sections: SectionFlags;

  hero: { image: string | null; headline: Tri };

  overview: {
    headline: Tri;
    tagline: Tri;
    seatingId: number | null;
    driveId: number | null;
  };

  // Shared specs (shown in Overview AND Performance)
  specs: { engine: Tri; maxPower: Tri; maxTorque: Tri };

  design: {
    title: Tri;
    heroImage: string | null;
    exterior: DesignCardItem[];
    interior: DesignCardItem[];
  };

  additionalDesign: { heading: Tri; items: AdditionalItem[] }; // exactly 3

  visualizer: { spin: SpinColor[]; threeSixty: ThreeSixtyColor[] };

  performance: {
    heroImage: string | null;
    transmission: Tri;
    accel0100: Tri;
    closingImage: string | null;
  };

  safety: { heading: Tri; cards: CardItem[] };

  convenience: { heading: Tri; image: string | null; cards: CardItem[] };

  gallery: GalleryItem[];

  highlights: HighlightItem[];
}

export const SPIN_FRAME_COUNT = 36;

import { uuidv4 } from "@/lib/uuid";

const uid = () => uuidv4();

export const newDesignCard = (): DesignCardItem => ({
  key: uid(),
  caption: emptyTri(),
  image: null,
});

export const newHighlight = (): HighlightItem => ({
  key: uid(),
  title: emptyTri(),
  description: emptyTri(),
  image: null,
});

export const newCard = (): CardItem => ({
  key: uid(),
  title: emptyTri(),
  description: emptyTri(),
  image: null,
});

export const newGalleryItem = (): GalleryItem => ({ key: uid(), image: null });

export const newSpinColor = (): SpinColor => ({
  key: uid(),
  colorHex: "#1a1d21",
  colorName: emptyTri(),
  frames: Array<string | null>(SPIN_FRAME_COUNT).fill(null),
});

export const new360Color = (): ThreeSixtyColor => ({
  key: uid(),
  colorHex: "#1a1d21",
  colorName: emptyTri(),
  image: null,
});

export function emptyCarForm(): CarFormState {
  return {
    id: uid(),
    name: emptyTri(),
    categoryId: null,
    sections: allSectionsOn(),
    hero: { image: null, headline: emptyTri() },
    overview: {
      headline: emptyTri(),
      tagline: emptyTri(),
      seatingId: null,
      driveId: null,
    },
    specs: { engine: emptyTri(), maxPower: emptyTri(), maxTorque: emptyTri() },
    design: {
      title: emptyTri(),
      heroImage: null,
      exterior: [],
      interior: [],
    },
    additionalDesign: {
      heading: emptyTri(),
      items: [
        { key: uid(), label: emptyTri(), image: null },
        { key: uid(), label: emptyTri(), image: null },
        { key: uid(), label: emptyTri(), image: null },
      ],
    },
    visualizer: { spin: [], threeSixty: [] },
    performance: {
      heroImage: null,
      transmission: emptyTri(),
      accel0100: emptyTri(),
      closingImage: null,
    },
    safety: { heading: emptyTri(), cards: [] },
    convenience: { heading: emptyTri(), image: null, cards: [] },
    gallery: [],
    highlights: [],
  };
}
