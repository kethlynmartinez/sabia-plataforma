import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

export const usePageTitle = (title: string, suffix: string = BRAND.name) => {
  useEffect(() => {
    document.title = title ? `${title} · ${suffix}` : suffix;
  }, [title, suffix]);
};
