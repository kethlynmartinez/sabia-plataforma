import { useState, type ReactNode } from "react";
import { Loader2, Star, type LucideIcon } from "lucide-react";
import type { CourseStatus } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ------------------------------ Cabeçalho de página ------------------------------ */

export const PageHeader = ({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) => (
  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow mb-1.5 text-primary">{eyebrow}</p>}
      <h1 className="font-sora text-2xl font-bold text-foreground md:text-[28px]">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl font-dm text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);

/* ------------------------------------ Cards ------------------------------------ */

export const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "primary" | "highlight" | "success" | "warning";
}) => {
  const tones = {
    primary: "bg-primary-soft text-primary",
    highlight: "bg-highlight-soft text-highlight",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="font-dm text-[13px] font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 font-sora text-[26px] font-bold leading-none text-foreground">{value}</p>
      {hint && <p className="mt-2 font-dm text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/60 px-6 py-14 text-center", className)}>
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
      <Icon className="h-6 w-6" />
    </span>
    <h3 className="mt-4 font-sora text-base font-semibold text-foreground">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm font-dm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ------------------------------- Progresso / status ------------------------------- */

export const ProgressBar = ({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "success" }) => (
  <div
    className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div
      className={cn("h-full rounded-full transition-[width] duration-500", tone === "success" ? "bg-success" : "bg-primary")}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

const STATUS: Record<CourseStatus, { label: string; cls: string }> = {
  publicado: { label: "Publicado", cls: "bg-success-soft text-success" },
  rascunho: { label: "Rascunho", cls: "bg-warning-soft text-warning" },
  arquivado: { label: "Arquivado", cls: "bg-muted text-muted-foreground" },
};

export const CourseStatusChip = ({ status, className }: { status: CourseStatus; className?: string }) => (
  <span className={cn("chip", STATUS[status].cls, className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {STATUS[status].label}
  </span>
);

export const Avatar = ({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) => {
  const sizes = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-16 w-16 text-lg" };
  const parts = name.trim().split(/\s+/);
  const label = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-sora font-semibold text-primary", sizes[size], className)}>
      {label}
    </span>
  );
};

export const Stars = ({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "lg";
}) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const cls = size === "lg" ? "h-8 w-8" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)} role={onChange ? "radiogroup" : undefined} aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
          >
            <Star className={cn(cls, n <= shown ? "fill-highlight text-highlight" : "text-border")} />
          </button>
        ) : (
          <Star key={n} className={cn(cls, n <= Math.round(value) ? "fill-highlight text-highlight" : "text-border")} />
        ),
      )}
    </div>
  );
};

/* ---------------------------------- Carregamento ---------------------------------- */

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-xl bg-muted", className)} />
);

export const PageLoader = () => (
  <div className="space-y-5" aria-busy="true" aria-label="Carregando">
    <Skeleton className="h-9 w-64" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <Skeleton className="h-72" />
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
    <p className="font-dm text-sm text-destructive">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-outline btn-sm mt-4">
        Tentar novamente
      </button>
    )}
  </div>
);

/* ------------------------------------ Formulário ------------------------------------ */

export const Field = ({
  label,
  error,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <div className={className}>
    <label className="field-label" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="mt-1 font-dm text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

/* ------------------------------------- Diálogos ------------------------------------- */

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  tone = "danger",
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="font-dm">{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <button className="btn-ghost" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancelar
        </button>
        <button className={tone === "danger" ? "btn-danger" : "btn-primary"} onClick={onConfirm} disabled={loading}>
          {loading && <Spinner />}
          {confirmLabel}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
