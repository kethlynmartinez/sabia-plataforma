const DAY = 24 * 60 * 60 * 1000;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export const formatNumber = (n: number) => n.toLocaleString("pt-BR");

export const formatPercent = (n: number) => `${Math.round(n)}%`;

export const relativeTime = (iso?: string) => {
  if (!iso) return "Nunca acessou";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Agora";
  if (min < 60) return `Há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Há ${h}h`;
  const d = Math.round(diff / DAY);
  if (d === 1) return "Ontem";
  if (d < 30) return `Há ${d} dias`;
  return formatDate(iso);
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

export const todayLabel = () => {
  const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const pluralize = (n: number, singular: string, plural: string) =>
  `${formatNumber(n)} ${n === 1 ? singular : plural}`;

export const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
