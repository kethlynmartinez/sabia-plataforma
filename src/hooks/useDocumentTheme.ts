import { useLayoutEffect } from "react";
import { applyThemeToDocument, isHex, resetDocumentTheme } from "@/lib/theme";

/**
 * Aplica o tema da empresa no documento inteiro enquanto o componente estiver
 * montado (inclui modais e toasts, que são renderizados fora da árvore).
 * Ao sair da área da empresa, volta para a identidade padrão da plataforma.
 */
export const useDocumentTheme = (primary?: string, highlight?: string) => {
  useLayoutEffect(() => {
    if (!primary || !highlight || !isHex(primary) || !isHex(highlight)) return;
    applyThemeToDocument(primary, highlight);
    return () => resetDocumentTheme();
  }, [primary, highlight]);
};
