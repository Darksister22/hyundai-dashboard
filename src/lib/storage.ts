"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET } from "@/lib/upload";

/**
 * Recursively delete every object under a Storage prefix.
 * Supabase `list()` isn't recursive, so we walk subfolders ourselves.
 * Returns the number of files removed.
 */
export async function removeFolder(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<number> {
  const files: string[] = [];

  async function walk(dir: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(dir, { limit: 1000 });
    if (error) throw error;
    for (const entry of data ?? []) {
      const path = dir ? `${dir}/${entry.name}` : entry.name;
      // Supabase represents folders as entries with a null id.
      if (entry.id === null) await walk(path);
      else files.push(path);
    }
  }

  await walk(prefix);

  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) throw error;
  }
  return files.length;
}

/** Delete all images belonging to a car (cars/{carId}/...). */
export async function deleteCarAssets(
  supabase: SupabaseClient,
  carId: string
): Promise<number> {
  return removeFolder(supabase, BUCKET, `cars/${carId}`);
}
