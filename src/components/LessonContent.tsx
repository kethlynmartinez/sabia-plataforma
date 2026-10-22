/** Renderiza o texto simples das aulas: parágrafos separados por linha em branco e listas com "- ". */
export const LessonContent = ({ text }: { text: string }) => {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (!blocks.length) return null;

  return (
    <div className="space-y-4 font-dm text-[15px] leading-relaxed text-foreground/85">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((l) => (
                <li key={l} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {l.slice(2)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <div key={i} className="space-y-2">
            {lines.map((l, j) =>
              l.startsWith("- ") ? (
                <p key={j} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {l.slice(2)}
                </p>
              ) : (
                <p key={j}>{l}</p>
              ),
            )}
          </div>
        );
      })}
    </div>
  );
};
