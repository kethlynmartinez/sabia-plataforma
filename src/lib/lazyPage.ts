import { lazy, type ComponentType } from "react";

const KEY = "sabia:recarregou-versao";

/**
 * lazy() que se recupera de uma publicação nova: se a aba ficou aberta com a versão anterior,
 * os arquivos das páginas mudaram de nome e o import falha. Nesse caso a página recarrega uma vez.
 */
export const lazyPage = <T extends ComponentType<object>>(load: () => Promise<{ default: T }>) =>
  lazy(async () => {
    try {
      const mod = await load();
      sessionStorage.removeItem(KEY);
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw err;
    }
  });
