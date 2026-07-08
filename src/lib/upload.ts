"use client";

import { createClient } from "@/lib/supabase/client";

export const BUCKET = "car-assets";

const EXT_OK = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

/**
 * Upload one image to `car-assets` at `pathNoExt.<ext>` and return its public
 * URL. Uses upsert so re-picking the same slot replaces the file.
 */
export async function uploadImage(
  file: File,
  pathNoExt: string
): Promise<string> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const rawExt = (file.name.split(".").pop() || "jpg").toLowerCase();
  const ext = EXT_OK.includes(rawExt) ? rawExt : "jpg";
  const path = `${pathNoExt}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const VIDEO_EXT = ["mp4", "webm", "mov", "m4v"];
export const MAX_VIDEO_SECONDS = 10;

/**
 * Upload an image OR video to `car-assets` and report which it is.
 * Returns the public URL and detected media type.
 */
export async function uploadMedia(
  file: File,
  pathNoExt: string
): Promise<{ url: string; type: "image" | "video" }> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const rawExt = (file.name.split(".").pop() || "").toLowerCase();
  const isVideo = file.type.startsWith("video/") || VIDEO_EXT.includes(rawExt);
  const ext = rawExt || (isVideo ? "mp4" : "jpg");
  const path = `${pathNoExt}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, type: isVideo ? "video" : "image" };
}

/** Read a video file's duration (seconds) in the browser. */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src);
      resolve(v.duration);
    };
    v.onerror = () => reject(new Error("Couldn't read the video."));
    v.src = URL.createObjectURL(file);
  });
}
