import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import seloPequeno from "@/assets/selos/logo-pequeno.webp";

interface Props {
  variant?: "light" | "dark";
  className?: string;
  compact?: boolean;
}

/** Símbolo da plataforma: o selo do sabiá-una, preto, com o bico e o olho amarelos. */
export const BrandMark = ({ className }: { className?: string }) => (
  <img
    src={seloPequeno}
    width={130}
    height={144}
    alt=""
    aria-hidden="true"
    className={cn("h-10 w-auto shrink-0 object-contain", className)}
  />
);

/** Logo da plataforma: selo + nome em Sora ExtraBold, em minúsculas. Não muda com o tema da empresa cliente. */
export const BrandLogo = ({ variant = "dark", className, compact }: Props) => (
  <span className={cn("inline-flex items-center gap-2", className)} aria-label={BRAND.name}>
    <BrandMark />
    {!compact && (
      <span className={cn("font-sora text-2xl font-extrabold lowercase leading-none tracking-[-0.03em]", variant === "light" ? "text-[#F6F3EA]" : "text-ink")}>
        {BRAND.name}
      </span>
    )}
  </span>
);
