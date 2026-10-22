import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
  color: string;
}

interface ParticlesCanvasProps {
  count?: number;
  className?: string;
  /** Cores em "r,g,b" */
  colors?: string[];
}

/** Partículas subindo devagar — textura usada nas telas escuras da plataforma. */
export const ParticlesCanvas = ({
  count = 50,
  className = "",
  colors = ["140,122,255", "96,165,250", "255,255,255"],
}: ParticlesCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: Particle[] = [];

    const create = (y?: number): Particle => ({
      x: Math.random() * width,
      y: y ?? height + Math.random() * 40,
      r: Math.random() * 1.8 + 0.4,
      vy: Math.random() * 0.27 + 0.08,
      alpha: Math.random() * 0.4 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.vy;
        if (p.y < -10) Object.assign(p, create());
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    particles = Array.from({ length: count }, () => create(Math.random() * height));
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[1] h-full w-full ${className}`}
    />
  );
};
