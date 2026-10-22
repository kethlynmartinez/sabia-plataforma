import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * <img> com estado de carregamento e fallback na cor do tema,
 * para que uma URL externa quebrada nunca deixe um buraco no layout.
 */
export const SmartImage = ({ src, alt = "", className, ...rest }: ImgHTMLAttributes<HTMLImageElement>) => {
  const [status, setStatus] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");

  return (
    <span className={cn("relative block overflow-hidden bg-primary-soft", className)}>
      {status !== "error" && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          // absoluta: a proporção vem do container, nunca da foto (retratos não esticam o card)
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            status === "ok" ? "opacity-100" : "opacity-0",
          )}
          {...rest}
        />
      )}
      {status !== "ok" && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-highlight/70",
            status === "loading" && "animate-pulse",
          )}
          aria-hidden="true"
        >
          {status === "error" && <ImageOff className="h-6 w-6 text-white/70" />}
        </span>
      )}
    </span>
  );
};
