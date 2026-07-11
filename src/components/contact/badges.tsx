"use client";

import { cn } from "@/lib/utils";
import type { ContactInquiry, ContactStatus } from "@/types/db";

export const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const INQUIRY_LABEL: Record<ContactInquiry, string> = {
  general: "General",
  sales: "Sales",
  service: "Service",
  complaint: "Complaint",
};

/** Small colored pill for the submission status. */
export function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "new" &&
          "bg-[var(--color-sky-100)] text-[var(--color-sky)]",
        status === "in_progress" &&
          "bg-[var(--color-app)] text-[var(--color-ink-muted)]",
        status === "resolved" &&
          "bg-[var(--color-ok)]/10 text-[var(--color-ok)]"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "new" && "bg-[var(--color-sky)]",
          status === "in_progress" && "bg-[var(--color-ink-faint)]",
          status === "resolved" && "bg-[var(--color-ok)]"
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Neutral pill for the inquiry type; complaints get the danger tint. */
export function InquiryBadge({ inquiry }: { inquiry: ContactInquiry }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        inquiry === "complaint"
          ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-50)] text-[var(--color-danger)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]"
      )}
    >
      {INQUIRY_LABEL[inquiry]}
    </span>
  );
}
