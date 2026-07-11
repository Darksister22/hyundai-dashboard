"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { BUCKET } from "@/lib/upload";

/* ---------------------------------------------------------------------
 * Listing
 * ------------------------------------------------------------------- */

/**
 * Recursively list every file path under a Storage prefix.
 * Supabase `list()` isn't recursive, so we walk subfolders ourselves
 * (folders come back as entries with a null id).
 */
export async function listAllFiles(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(dir, { limit: 1000 });
    if (error) throw error;
    for (const entry of data ?? []) {
      const path = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.id === null) await walk(path);
      else files.push(path);
    }
  }

  await walk(prefix);
  return files;
}

/* ---------------------------------------------------------------------
 * Deleting
 * ------------------------------------------------------------------- */

async function removeBatched(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
): Promise<void> {
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { data, error } = await supabase.storage.from(bucket).remove(batch);
    if (error) throw error;
    // RLS-blocked deletes "succeed" with fewer results — surface that
    if ((data?.length ?? 0) < batch.length) {
      throw new Error(
        `Storage deleted ${data?.length ?? 0}/${batch.length} files — check the DELETE policy on bucket "${bucket}".`
      );
    }
  }
}

/**
 * Recursively delete every object under a Storage prefix.
 * Returns the number of files removed.
 */
export async function removeFolder(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<number> {
  const files = await listAllFiles(supabase, bucket, prefix);
  await removeBatched(supabase, bucket, files);
  return files.length;
}

/** Delete all images belonging to a car (cars/{carId}/...). */
export async function deleteCarAssets(
  supabase: SupabaseClient,
  carId: string
): Promise<number> {
  return removeFolder(supabase, BUCKET, `cars/${carId}`);
}

/* ---------------------------------------------------------------------
 * URL ↔ path + targeted cleanup
 * ------------------------------------------------------------------- */

/**
 * Convert a public Storage URL back into its object path within `bucket`.
 * Returns null for URLs that don't belong to this bucket.
 */
export function urlToStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  let path = url.slice(i + marker.length);
  const q = path.indexOf("?");
  if (q !== -1) path = path.slice(0, q);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Delete one file by its public URL (fire-and-forget friendly).
 * Used when a picker REPLACES an existing image/video: the old file is
 * removed as soon as the new upload succeeds. Never throws — a failed
 * cleanup must not break the editing flow (save-time GC catches it).
 */
export async function deleteByUrl(url: string): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) return;
    const path = urlToStoragePath(url, BUCKET);
    if (!path) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) console.warn("[storage] deleteByUrl failed:", error.message);
  } catch (e) {
    console.warn("[storage] deleteByUrl failed:", e);
  }
}

/**
 * Garbage-collect a Storage prefix: delete every file under `prefix`
 * that is NOT among `referencedUrls`. Called after a successful save so
 * replaced/removed media doesn't pile up. Returns files removed.
 */
export async function removeUnreferenced(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string,
  referencedUrls: Iterable<string | null | undefined>
): Promise<number> {
  const keep = new Set<string>();
  for (const u of referencedUrls) {
    if (!u) continue;
    const p = urlToStoragePath(u, bucket);
    if (p) keep.add(p);
  }

  const files = await listAllFiles(supabase, bucket, prefix);
  const stale = files.filter((f) => !keep.has(f));
  await removeBatched(supabase, bucket, stale);
  return stale.length;
}