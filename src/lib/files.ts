/**
 * Utilitários de arquivo do lado do cliente.
 * Como o back-end é simulado em localStorage (~5 MB), imagens enviadas são
 * redimensionadas e comprimidas antes de virar data URL.
 */

export const compressImage = (file: File, maxSide = 1400, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem"));
      return;
    }
    // SVG não precisa (nem pode) ser rasterizado com perda
    if (file.type === "image/svg+xml") {
      if (file.size > 200_000) {
        reject(new Error("SVG muito grande (máx. 200 KB)"));
        return;
      }
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
      r.readAsDataURL(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Seu navegador não suporta o processamento da imagem"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const keepAlpha = file.type === "image/png" || file.type === "image/webp";
      resolve(canvas.toDataURL(keepAlpha ? "image/webp" : "image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir a imagem"));
    };
    img.src = url;
  });

type Cell = string | number | boolean | null | undefined;

/** CSV com ";" e BOM para abrir corretamente no Excel em português. */
export const downloadCsv = (filename: string, header: string[], rows: Cell[][]) => {
  const esc = (v: Cell) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Converte links do YouTube/Vimeo para URL de embed. Retorna null se não reconhecer. */
export const toEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace("www.", "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com${u.pathname}`;
      if (u.pathname.startsWith("/shorts/"))
        return `https://www.youtube-nocookie.com/embed/${u.pathname.split("/")[2]}`;
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/")[1]}`;
    if (host === "player.vimeo.com") return u.toString();
    return null;
  } catch {
    return null;
  }
};
