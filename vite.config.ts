import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// `base: "./"` gera caminhos relativos: o build funciona em qualquer subpasta
// (ex.: https://usuario.github.io/sabia-plataforma/) sem configurar o nome do repositório.
// Como o roteamento usa HashRouter, não é preciso 404.html para o GitHub Pages.
export default defineConfig({
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
