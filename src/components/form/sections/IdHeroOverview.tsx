"use client";

import {
  Field,
  TriField,
  Select,
  ImageUpload,
  SubBlock,
} from "../primitives";
import type { SectionProps } from "./_shared";

/* ============================================================ ID */
export function IdSection({ state, set, options }: SectionProps) {
  return (
    <div className="space-y-6">
      <TriField
        label="Car name"
        required
        value={state.name}
        onChange={(name) => set((s) => ({ ...s, name }))}
        placeholder="e.g. Tucson"
      />
      <div className="max-w-sm">
        <Field
          label="Category"
          hint="Manage the list of categories in the Lists tab."
        >
          <Select
            value={state.categoryId}
            onChange={(categoryId) => set((s) => ({ ...s, categoryId }))}
            options={options.categories}
            emptyHint="No categories yet — add some in the Lists tab."
          />
        </Field>
      </div>
    </div>
  );
}

/* ========================================================== HERO */
export function HeroSection({ state, set }: SectionProps) {
  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Field label="Hero image" hint="Shown on the car card and page banner.">
          <ImageUpload
            value={state.hero.image}
            onChange={(image) =>
              set((s) => ({ ...s, hero: { ...s.hero, image } }))
            }
            path={`cars/${state.id}/hero`}
          />
        </Field>
      </div>
      <TriField
        label="Hero headline"
        value={state.hero.headline}
        onChange={(headline) =>
          set((s) => ({ ...s, hero: { ...s.hero, headline } }))
        }
      />
    </div>
  );
}

/* ====================================================== OVERVIEW */
export function OverviewSection({ state, set, options }: SectionProps) {
  return (
    <div className="space-y-6">
      <TriField
        label="Headline"
        value={state.overview.headline}
        onChange={(headline) =>
          set((s) => ({ ...s, overview: { ...s.overview, headline } }))
        }
      />
      <TriField
        label="Tagline"
        multiline
        value={state.overview.tagline}
        onChange={(tagline) =>
          set((s) => ({ ...s, overview: { ...s.overview, tagline } }))
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seating">
          <Select
            value={state.overview.seatingId}
            onChange={(seatingId) =>
              set((s) => ({ ...s, overview: { ...s.overview, seatingId } }))
            }
            options={options.seating}
            emptyHint="No seating options yet — add them in the Lists tab."
          />
        </Field>
        <Field label="Drive">
          <Select
            value={state.overview.driveId}
            onChange={(driveId) =>
              set((s) => ({ ...s, overview: { ...s.overview, driveId } }))
            }
            options={options.drive}
            emptyHint="No drive options yet — add them in the Lists tab."
          />
        </Field>
      </div>

      <SubBlock
        title="Specs"
        description="Shared with the Performance section — fill once, shows in both."
      >
        <div className="space-y-5">
          <TriField
            label="Engine"
            value={state.specs.engine}
            onChange={(engine) =>
              set((s) => ({ ...s, specs: { ...s.specs, engine } }))
            }
            placeholder="e.g. 1.6L Turbo"
          />
          <TriField
            label="Max power"
            value={state.specs.maxPower}
            onChange={(maxPower) =>
              set((s) => ({ ...s, specs: { ...s.specs, maxPower } }))
            }
            placeholder="e.g. 180 hp"
          />
          <TriField
            label="Max torque"
            value={state.specs.maxTorque}
            onChange={(maxTorque) =>
              set((s) => ({ ...s, specs: { ...s.specs, maxTorque } }))
            }
            placeholder="e.g. 265 Nm"
          />
        </div>
      </SubBlock>
    </div>
  );
}
