import type { CSSProperties } from "react";

/**
 * Tema white-label: a empresa escolhe 2 cores (primária e destaque) e o restante
 * da paleta é derivado aqui — hover, tons suaves e cor de texto com contraste.
 * Os valores viram CSS custom properties consumidas pelo Tailwind (index.css).
 */

type Hsl = { h: number; s: number; l: number };

export const isHex = (v: string) => /^#?[0-9a-f]{6}$/i.test(v.trim());

export const normalizeHex = (v: string) => {
  const clean = v.trim().replace("#", "");
  return `#${clean.toUpperCase()}`;
};

export const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const hexToHsl = (hex: string): Hsl => {
  const { r: R, g: G, b: B } = hexToRgb(hex);
  const r = R / 255;
  const g = G / 255;
  const b = B / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toVar = ({ h, s, l }: Hsl) => `${h} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%`;

/** Luminância relativa (WCAG) */
export const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const ch = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

export const contrastRatio = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Texto branco ou quase-preto, o que tiver mais contraste sobre a cor. */
export const readableOn = (hex: string) =>
  contrastRatio(hex, "#FFFFFF") >= contrastRatio(hex, "#16181B") ? "#FFFFFF" : "#16181B";

const paletteFor = (hex: string, prefix: "primary" | "highlight") => {
  const base = hexToHsl(hex);
  const fg = readableOn(hex) === "#FFFFFF" ? "0 0% 100%" : "220 10% 11%";
  const vars: Record<string, string> = {
    [`--${prefix}`]: toVar(base),
    [`--${prefix}-foreground`]: fg,
    [`--${prefix}-soft`]: toVar({ h: base.h, s: Math.min(base.s, 90), l: 96 }),
  };
  if (prefix === "primary") {
    vars["--primary-hover"] = toVar({ ...base, l: base.l - 7 });
    vars["--primary-light"] = toVar({ ...base, l: Math.min(base.l + 14, 82) });
    vars["--primary-strong"] = toVar({ ...base, l: clamp(base.l - 22, 14, 40) });
    vars["--ring"] = toVar(base);
  }
  return vars;
};

export const themeVars = (primary: string, highlight: string): Record<string, string> => ({
  ...paletteFor(primary, "primary"),
  ...paletteFor(highlight, "highlight"),
});

/** Para aplicar o tema só dentro de um elemento (ex.: pré-visualizações). */
export const themeStyle = (primary: string, highlight: string) =>
  themeVars(primary, highlight) as CSSProperties;

const APPLIED_KEYS = new Set<string>();

export const applyThemeToDocument = (primary: string, highlight: string) => {
  const root = document.documentElement;
  Object.entries(themeVars(primary, highlight)).forEach(([k, v]) => {
    root.style.setProperty(k, v);
    APPLIED_KEYS.add(k);
  });
};

export const resetDocumentTheme = () => {
  const root = document.documentElement;
  APPLIED_KEYS.forEach((k) => root.style.removeProperty(k));
  APPLIED_KEYS.clear();
};
