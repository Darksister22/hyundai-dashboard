# Hyundai Iraq — Content Dashboard

A Next.js + Supabase dashboard for managing the website's content. This is the
CMS backend the Hyundai site reads from. **Cars** is the active module; the
other nav sections (Stories, Hero banners, Find us, Contact us) are placeholders
for now.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Storage)
- lucide-react icons

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Create a Supabase project**, then in the SQL editor run, in order:
   - `supabase/schema.sql` — all 13 tables
   - `supabase/storage.sql` — the `car-assets` bucket + dev policies
   - `supabase/rls.sql` — turns on Row Level Security (public read, admin-only write)

3. **Environment** — copy the example and fill in from
   Supabase → Project Settings → API:
   ```bash
   cp .env.local.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — it redirects to `/cars`.

Without env vars the app still runs; the Cars tab shows a "Connect Supabase"
notice instead of crashing.

## Data model (recap)

- **Relational**, portable SQL (ports to MySQL/Oracle).
- Trilingual text uses `*_ar` / `*_en` / `*_ku` columns. `*_en` is required;
  the others are nullable and **fall back to English at render time**
  (see `src/lib/i18n.ts → pick()`).
- 1:1 car content lives on the wide `cars` table; repeatable content
  (highlights, design cards, safety, convenience, gallery, visualizer) lives in
  child tables that cascade on delete.
- `category` / `seating` / `drive` are editable lists; cars reference them, and
  deletes are blocked while a car uses them (`ON DELETE RESTRICT`).
- Slugs auto-derive from the English name (`src/lib/utils.ts → slugify()`).

## Images / Storage

Bucket `car-assets`, planned path convention:
```
cars/{carId}/hero.{ext}
cars/{carId}/highlights/{cardId}.{ext}
cars/{carId}/design/{exterior|interior}/...
cars/{carId}/additional/{1|2|3}.{ext}
cars/{carId}/visualizer/spin/{colorId}/frame-01..36.{ext}
cars/{carId}/visualizer/360/{colorId}.{ext}
cars/{carId}/performance/{hero|closing}.{ext}
cars/{carId}/safety/{cardId}.{ext}
cars/{carId}/convenience/{cardId}.{ext}
cars/{carId}/gallery/{imageId}.{ext}
```

## Auth & security (RLS)

Row Level Security is enabled by `rls.sql`: **anyone can read** (the website and
dashboard read with the anon key), but **only authenticated admins can write**.
The dashboard is gated behind a login at `/login`; `middleware.ts` redirects
anyone not signed in.

One-time setup in the Supabase dashboard:
1. **Authentication → Users → Add user**: create your admin (email + password),
   and tick **Auto Confirm User**.
2. **Authentication → Sign In / Providers**: turn **off** "Allow new users to
   sign up", so only the admins you create can log in.

Then start the app, go to `/login`, and sign in. Sign-out is in the sidebar.

> If you add more admins later and ever re-enable public sign-ups, switch the
> write policies from "any authenticated user" to an allowlist (e.g. an
> `admins` table) — see `rls.sql`.

## What's built

- Project scaffold, Hyundai theme (light + dark), nav shell (all 5 sections; Cars wired).
- Full database schema + storage setup.
- Cars module shell: Cars / Lists toggle, search (name + category), car card
  grid with hero image + edit/delete, and all empty / loading / error states.
  Delete is wired; the Add/Edit form routes are placeholders.

## Next

1. **Category & lists manager** (categories, seating, drive — trilingual CRUD).
2. **Add/Edit car form** — the sectioned stepper with image uploads.
3. Wire **Upload / Preview / Cancel** + validation.
