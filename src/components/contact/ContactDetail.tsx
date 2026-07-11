"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Mail,
  Paperclip,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ContactStatus, ContactSubmission } from "@/types/db";
import { InquiryBadge, StatusBadge, STATUS_LABEL } from "./badges";

const STATUSES: ContactStatus[] = ["new", "in_progress", "resolved"];

export function ContactDetail({ initial }: { initial: ContactSubmission }) {
  const { alert } = useDialog();
  const [row, setRow] = useState(initial);
  const [saving, setSaving] = useState<ContactStatus | null>(null);

  const name = `${row.first_name} ${row.last_name}`.trim();
  const date = new Date(row.created_at).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function changeStatus(next: ContactStatus) {
    if (next === row.status || saving) return;
    const supabase = createClient();
    if (!supabase) return;

    const prev = row.status;
    setSaving(next);
    setRow((r) => ({ ...r, status: next })); // optimistic
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status: next })
      .eq("id", row.id);
    setSaving(null);
    if (error) {
      setRow((r) => ({ ...r, status: prev })); // roll back
      await alert({ title: "Couldn't update status", description: error.message });
    }
  }

  return (
    <div className="px-8 py-6">
      <Link
        href="/contact"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="size-4" /> Back to submissions
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                  {name}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-ink-faint)]">
                  {date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <InquiryBadge inquiry={row.inquiry_type} />
                <StatusBadge status={row.status} />
              </div>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={<Phone className="size-4" />}
                label="Phone"
                value={
                  <a
                    href={`tel:${row.phone}`}
                    dir="ltr"
                    className="text-[var(--color-sky)] hover:underline"
                  >
                    {row.phone}
                  </a>
                }
              />
              <InfoItem
                icon={<Mail className="size-4" />}
                label="Email"
                value={
                  row.email ? (
                    <a
                      href={`mailto:${row.email}`}
                      className="text-[var(--color-sky)] hover:underline"
                    >
                      {row.email}
                    </a>
                  ) : (
                    <span className="text-[var(--color-ink-faint)]">—</span>
                  )
                }
              />
              <InfoItem
                label="Gender"
                value={
                  row.gender ? (
                    row.gender === "male" ? "Male" : "Female"
                  ) : (
                    <span className="text-[var(--color-ink-faint)]">—</span>
                  )
                }
              />
              <InfoItem
                label="Marketing consent"
                value={row.opted_out ? "Opted out" : "Consented"}
              />
            </dl>
          </div>

          {/* Comments */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <FileText className="size-4 text-[var(--color-ink-muted)]" />
              Comments
            </h3>
            {row.comments ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]">
                {row.comments}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-ink-faint)]">
                No comments left.
              </p>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Status changer */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">
              Status
            </h3>
            <div className="flex flex-col gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeStatus(s)}
                  disabled={saving !== null}
                  className={cn(
                    "flex h-10 items-center justify-between rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-colors disabled:opacity-60",
                    row.status === s
                      ? "border-[var(--color-sky)] bg-[var(--color-sky-100)] text-[var(--color-navy)]"
                      : "border-[var(--color-line-strong)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]"
                  )}
                >
                  {STATUS_LABEL[s]}
                  {saving === s ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <Paperclip className="size-4 text-[var(--color-ink-muted)]" />
              Attachments
              <span className="text-xs font-normal text-[var(--color-ink-faint)]">
                {row.attachments.length}/2
              </span>
            </h3>
            {row.attachments.length > 0 ? (
              <ul className="space-y-2">
                {row.attachments.map((url, i) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 truncate rounded-[var(--radius-md)] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-sky)] hover:bg-[var(--color-app)]"
                    >
                      <Paperclip className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {fileLabel(url, i)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-ink-faint)]">
                No files attached.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Attachment file names are generated UUIDs — show a friendly label with the extension. */
function fileLabel(url: string, index: number) {
  const ext = url.split(".").pop()?.toUpperCase() ?? "FILE";
  return `Attachment ${index + 1} (${ext})`;
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
