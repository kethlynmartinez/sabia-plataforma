import { describe, expect, it } from "vitest";
import { contrastRatio, hexToHsl, readableOn, themeVars } from "@/lib/theme";
import { maskPhone, passwordIssue } from "@/lib/validation";
import { toEmbedUrl } from "@/lib/files";

describe("tema white-label", () => {
  it("converte hex para HSL", () => {
    expect(hexToHsl("#664DFD")).toEqual({ h: 249, s: 98, l: 65 });
  });

  it("escolhe a cor de texto com mais contraste", () => {
    expect(readableOn("#0F766E")).toBe("#FFFFFF");
    expect(readableOn("#FDE68A")).toBe("#16181B");
  });

  it("calcula contraste WCAG", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("deriva a paleta completa a partir de duas cores", () => {
    const vars = themeVars("#0F766E", "#F59E0B");
    expect(vars["--primary"]).toBe("175 77% 26%");
    expect(vars).toHaveProperty("--primary-soft");
    expect(vars).toHaveProperty("--highlight-foreground");
  });
});

describe("utilitários de formulário", () => {
  it("aplica máscara de telefone", () => {
    expect(maskPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("valida a força mínima da senha", () => {
    expect(passwordIssue("abc")).not.toBe("");
    expect(passwordIssue("senhasemnumero")).not.toBe("");
    expect(passwordIssue("demo1234")).toBe("");
  });

  it("reconhece links de vídeo", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(toEmbedUrl("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345");
    expect(toEmbedUrl("https://exemplo.com/video.mp4")).toBeNull();
  });
});
