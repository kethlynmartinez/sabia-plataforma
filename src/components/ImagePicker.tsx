import { useRef, useState } from "react";
import { Check, Link2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "@/components/SmartImage";
import { Spinner } from "@/components/kit";
import { compressImage } from "@/lib/files";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (v: string | undefined) => void;
  presets?: string[];
  /** Lado máximo da imagem comprimida (px) */
  maxSide?: number;
  allowRemove?: boolean;
  aspect?: string;
  accept?: string;
}

/** Escolha de imagem: galeria pronta, URL externa ou upload (comprimido no navegador). */
export const ImagePicker = ({ value, onChange, presets = [], maxSide = 1400, allowRemove, aspect = "aspect-[16/9]", accept = "image/*" }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 8 MB)");
      return;
    }
    setBusy(true);
    try {
      onChange(await compressImage(file, maxSide));
      toast.success("Imagem carregada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao processar a imagem");
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    try {
      const u = new URL(url.trim());
      if (!/^https?:$/.test(u.protocol)) throw new Error();
      onChange(u.toString());
      setUrl("");
    } catch {
      toast.error("Cole uma URL válida começando com https://");
    }
  };

  return (
    <div className="space-y-3">
      {presets.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn("relative overflow-hidden rounded-lg ring-offset-2 transition-all", value === p ? "ring-2 ring-primary" : "hover:opacity-80")}
              aria-label="Usar esta imagem"
              aria-pressed={value === p}
            >
              <SmartImage src={p.replace("w=1200", "w=320").replace("w=1600", "w=320")} className="aspect-[4/3] w-full" />
              {value === p && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn("flex flex-col gap-3 rounded-xl border-[1.5px] border-dashed p-3 transition-colors sm:flex-row sm:items-center", dragging ? "border-primary bg-primary-soft" : "border-input")}
      >
        {value && !presets.includes(value) && (
          <SmartImage src={value} className={cn("w-full shrink-0 rounded-lg sm:w-28", aspect)} />
        )}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button type="button" className="btn-soft btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Spinner /> : <Upload />} Enviar arquivo
          </button>
          <span className="font-dm text-xs text-muted-foreground">ou arraste aqui</span>
          {allowRemove && value && (
            <button type="button" className="btn-ghost btn-sm ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onChange(undefined)}>
              <Trash2 /> Remover
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
          <input
            className="field py-2 pl-9"
            placeholder="https://… (URL de imagem)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyUrl();
              }
            }}
            aria-label="URL da imagem"
          />
        </div>
        <button type="button" className="btn-outline btn-sm" onClick={applyUrl} disabled={!url.trim()}>
          Aplicar
        </button>
      </div>
    </div>
  );
};
