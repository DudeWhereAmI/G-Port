import React from "react";
import { Inbox, type LucideIcon } from "lucide-react";

const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover border border-brand",
  secondary: "bg-white text-ink border border-line hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 border border-transparent hover:bg-slate-100",
  danger: "bg-white text-danger border border-red-200 hover:bg-danger-soft",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", icon: Icon, iconRight: IconRight, className, children, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-3 text-label" : "h-9 px-3.5 text-sm",
        VARIANT[variant],
        className
      )}
      {...rest}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      {children}
      {IconRight && <IconRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </button>
  )
);
Button.displayName = "Button";

/** Icon-only button – `label` is required for screen readers. */
export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; badge?: number }> = ({
  icon: Icon,
  label,
  badge,
  className,
  ...rest
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cx("relative inline-flex items-center justify-center w-9 h-9 rounded-control text-slate-600 hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer", className)}
    {...rest}
  >
    <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-danger-dot text-white text-[11px] leading-4 font-semibold text-center">{badge}</span>
    )}
  </button>
);

// ---------------------------------------------------------------------------
// Input / Select
// ---------------------------------------------------------------------------

const FIELD = "h-9 w-full rounded-control border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }>(
  ({ icon: Icon, className, ...rest }, ref) => (
    <div className={cx("relative", className)}>
      {Icon && <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
      <input ref={ref} className={cx(FIELD, Icon && "pl-9")} {...rest} />
    </div>
  )
);
Input.displayName = "Input";

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className, children, ...rest }) => (
  <label className={cx("inline-flex items-center gap-2 text-label text-muted font-medium", className)}>
    {label}
    <select className={cx(FIELD, "w-auto pr-8 cursor-pointer")} {...rest}>
      {children}
    </select>
  </label>
);

// ---------------------------------------------------------------------------
// Tooltip (hover / focus)
// ---------------------------------------------------------------------------

export const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" }> = ({ content, children, side = "top" }) => (
  <span className="relative inline-flex group/tt">
    {children}
    <span
      role="tooltip"
      className={cx(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 z-40 w-max max-w-64 rounded-control bg-ink px-2.5 py-1.5 text-xs text-white shadow-overlay opacity-0 transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
        side === "top" ? "bottom-full mb-2" : "top-full mt-2"
      )}
    >
      {content}
    </span>
  </span>
);

// ---------------------------------------------------------------------------
// Tabs / SegmentedControl
// ---------------------------------------------------------------------------

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

/** Underline tabs for page sections. */
export function Tabs<T extends string>({ items, value, onChange }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-line overflow-x-auto">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={cx(
              "relative -mb-px flex items-center gap-2 py-3 text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2",
              active ? "border-brand text-ink font-medium" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {it.icon && <it.icon className="w-4 h-4" aria-hidden="true" />}
            {it.label}
            {it.count !== undefined && <span className="text-xs text-muted">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented switch for views / modes. */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  size = "md",
  ariaLabel,
}: {
  items: { id: T; label: string; icon?: LucideIcon; disabled?: boolean; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex items-center gap-0.5 rounded-control bg-slate-100 p-0.5">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={active}
            disabled={it.disabled}
            title={it.title}
            onClick={() => onChange(it.id)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-[5px] font-medium whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-slate-400",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-label",
              active ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
            )}
          >
            {it.icon && <it.icon className="w-4 h-4" aria-hidden="true" />}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState / Skeleton
// ---------------------------------------------------------------------------

export const EmptyState: React.FC<{ icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode; compact?: boolean }> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact,
}) => (
  <div className={cx("flex flex-col items-center justify-center text-center gap-3", compact ? "py-8" : "py-16")}>
    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
      <Icon className="w-5 h-5 text-slate-500" aria-hidden="true" />
    </div>
    <div className="space-y-1">
      <div className="text-base font-semibold text-ink">{title}</div>
      {description && <div className="text-sm text-muted max-w-md">{description}</div>}
    </div>
    {action}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={cx("animate-pulse rounded-control bg-slate-200/70", className)} />;

/** Generic page skeleton: header, KPI row, chart. */
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-live="polite">
    <Skeleton className="h-20" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[112px]" />
      ))}
    </div>
    <Skeleton className="h-80" />
  </div>
);

export { cx };
