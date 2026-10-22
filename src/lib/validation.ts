export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const isPhone = (v: string) => onlyDigits(v).length >= 10;

export const passwordIssue = (v: string) => {
  if (v.length < 8) return "Use pelo menos 8 caracteres";
  if (!/[a-zA-Z]/.test(v) || !/\d/.test(v)) return "Combine letras e números";
  return "";
};

export type Errors<T extends string> = Partial<Record<T, string>>;

export const hasErrors = (e: Record<string, string | undefined>) => Object.values(e).some(Boolean);
