import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactDetail } from "@/components/contact/ContactDetail";
import type { ContactSubmission } from "@/types/db";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <Fallback body="Supabase isn't connected. Add your environment variables and restart the dev server." />
    );
  }

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return (
      <Fallback body="This submission may have been deleted, or the link is wrong." />
    );
  }

  const row = data as ContactSubmission;

  return (
    <>
      <PageHeader
        title="Contact submission"
        description={`From ${row.first_name} ${row.last_name}`.trim()}
      />
      <ContactDetail initial={row} />
    </>
  );
}

function Fallback({ body }: { body: string }) {
  return (
    <>
      <PageHeader title="Contact submission" />
      <div className="px-8 py-16">
        <div className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-14 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">{body}</p>
          <Link
            href="/contact"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-app)]"
          >
            <ArrowLeft className="size-4" /> Back to submissions
          </Link>
        </div>
      </div>
    </>
  );
}
