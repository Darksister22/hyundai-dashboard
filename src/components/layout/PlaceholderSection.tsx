import { PageHeader } from "./PageHeader";

/**
 * Honest placeholder for nav sections not built yet. The Cars module is
 * the focus; these come later.
 */
export function PlaceholderSection({
  title,
  blurb,
  icon: Icon,
}: {
  title: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-8 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-8 py-14 text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-full bg-[var(--color-sky-100)] text-[var(--color-navy)]">
            <Icon className="size-6" />
          </span>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            {title} isn&apos;t built yet
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{blurb}</p>
        </div>
      </div>
    </>
  );
}
