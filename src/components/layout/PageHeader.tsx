export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
