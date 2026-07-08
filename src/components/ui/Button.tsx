import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line-strong)] hover:bg-[var(--color-app)]",
  ghost:
    "bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)]",
  danger:
    "bg-[var(--color-surface)] text-[var(--color-danger)] border border-[var(--color-line-strong)] hover:bg-[var(--color-danger-50)] hover:border-[var(--color-danger)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
