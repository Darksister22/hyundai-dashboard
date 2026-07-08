import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadCarForm } from "@/lib/car-load";
import { CarForm } from "@/components/form/CarForm";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <Fallback
        title="Edit car"
        body="Supabase isn't connected. Add your environment variables and restart the dev server."
      />
    );
  }

  const initial = await loadCarForm(supabase, id);
  if (!initial) {
    return (
      <Fallback
        title="Car not found"
        body="This car may have been deleted, or the link is wrong."
      />
    );
  }

  return <CarForm mode="edit" initial={initial} />;
}

function Fallback({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 sm:px-6">
        <Link
          href="/cars"
          className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]"
          aria-label="Back to cars"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h1>
      </header>
      <div className="px-8 py-16">
        <div className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-14 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">{body}</p>
          <Link
            href="/cars"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-app)]"
          >
            <ArrowLeft className="size-4" /> Back to cars
          </Link>
        </div>
      </div>
    </div>
  );
}
