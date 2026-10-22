import { useState } from "react";
import type { CompanyTheme } from "@/types";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  theme: Pick<CompanyTheme, "displayName" | "logoUrl">;
  variant?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

/**
 * Logo white-label: usa a imagem enviada pela empresa ou, na falta dela,
 * um monograma na cor primária do tema + o nome da plataforma.
 */
export const CompanyLogo = ({ theme, variant = "dark", compact, className }: Props) => {
  const [broken, setBroken] = useState(false);

  if (theme.logoUrl && !broken) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <img
          src={theme.logoUrl}
          alt={theme.displayName}
          onError={() => setBroken(true)}
          className={cn(
            "w-auto object-contain object-left",
            compact ? "h-9 max-w-9 object-cover rounded-lg" : "h-10 max-w-[180px]",
            variant === "light" && "rounded-lg bg-white/95 px-2 py-1",
          )}
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2.5", className)} title={theme.displayName}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-sora text-sm font-bold text-primary-foreground">
        {initials(theme.displayName) || "A"}
      </span>
      {!compact && (
        <span
          className={cn(
            "truncate font-sora text-[15px] font-bold leading-tight",
            variant === "light" ? "text-white" : "text-foreground",
          )}
        >
          {theme.displayName}
        </span>
      )}
    </span>
  );
};
