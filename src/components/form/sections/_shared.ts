"use client";

import type { CarFormState } from "@/types/car-form";

export interface Options {
  categories: { id: number; label: string }[];
  seating: { id: number; label: string }[];
  drive: { id: number; label: string }[];
}

export interface SectionProps {
  state: CarFormState;
  set: React.Dispatch<React.SetStateAction<CarFormState>>;
  options: Options;
}

/** Each form section: id (also the URL/storage hint), label, component. */
export interface StepDef {
  id: string;
  label: string;
  Component: React.ComponentType<SectionProps>;
}

/* ---- immutable array helpers ---- */
export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

export function replaceAt<T>(arr: T[], i: number, value: T): T[] {
  return arr.map((v, idx) => (idx === i ? value : v));
}
