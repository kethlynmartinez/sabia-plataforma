import { Award, CheckCheck, Play, TrendingUp } from "lucide-react";

/** Mockup do celular com a conversa no WhatsApp + cartões flutuantes do painel. */
export const HeroVisual = () => (
  <div className="relative mx-auto w-full max-w-[460px] lg:mx-0">
    {/* brilho de fundo */}
    <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/50 to-highlight/40 blur-[90px]" />

    {/* Celular */}
    <div className="relative mx-auto w-[280px] rounded-[44px] border border-white/15 bg-[#0c0d0f] p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] sm:w-[300px]">
      <div className="overflow-hidden rounded-[36px] bg-[#ECE5DD]">
        {/* cabeçalho estilo WhatsApp */}
        <div className="flex items-center gap-2.5 bg-[#075E54] px-4 pb-3 pt-7 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F766E] font-sora text-[11px] font-bold ring-2 ring-white/20">VA</span>
          <div className="min-w-0">
            <p className="truncate font-sora text-[13px] font-semibold leading-tight">Vértice Aprende</p>
            <p className="font-dm text-[10px] text-white/70">conta comercial · online</p>
          </div>
        </div>

        <div className="space-y-2.5 px-3 py-4 font-dm text-[12px] leading-snug text-[#111]">
          <p className="mx-auto w-fit rounded-md bg-[#E1F2FB] px-2 py-0.5 text-[10px] text-[#54656F]">HOJE</p>

          <div className="max-w-[88%] rounded-xl rounded-tl-sm bg-white p-2.5 shadow-sm">
            <p>
              Oi, Lucas! 👋 Sua próxima aula de <strong>Segurança na Operação de Empilhadeiras</strong> está pronta:
            </p>
            <div className="mt-2 overflow-hidden rounded-lg bg-[#F0F2F5]">
              <div className="flex items-center gap-2 p-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0F766E] text-white">
                  <Play className="h-4 w-4 fill-white" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold">Checklist pré-operacional</p>
                  <p className="text-[10px] text-[#667781]">Aula 2 de 6 · 10 min</p>
                </div>
              </div>
            </div>
            <p className="mt-1 text-right text-[9px] text-[#667781]">07:42</p>
          </div>

          <div className="ml-auto max-w-[70%] rounded-xl rounded-tr-sm bg-[#D9FDD3] p-2.5 shadow-sm">
            <p>Bora! Faço no intervalo 💪</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#667781]">
              07:45 <CheckCheck className="h-3 w-3 text-[#53BDEB]" />
            </p>
          </div>

          <div className="max-w-[88%] rounded-xl rounded-tl-sm bg-white p-2.5 shadow-sm">
            <p>Mandou bem! ✅ 4 de 6 aulas concluídas. A avaliação final já está liberada.</p>
            <p className="mt-1 text-right text-[9px] text-[#667781]">12:10</p>
          </div>

          <div className="flex w-fit items-center gap-1 rounded-xl rounded-tl-sm bg-white px-3 py-2.5 shadow-sm" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-[#667781]" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Cartão flutuante: certificado */}
    <div className="absolute -left-2 top-16 hidden w-[190px] animate-float rounded-2xl border border-white/10 bg-white p-3.5 shadow-card-lg sm:block lg:-left-14">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlight-soft text-highlight">
          <Award className="h-4 w-4" />
        </span>
        <div>
          <p className="font-sora text-[12px] font-bold text-foreground">Certificado emitido</p>
          <p className="font-dm text-[10px] text-muted-foreground">Nota 90 · automático</p>
        </div>
      </div>
    </div>

    {/* Cartão flutuante: engajamento */}
    <div className="absolute -right-2 bottom-14 hidden w-[200px] animate-float rounded-2xl border border-white/10 bg-white p-3.5 shadow-card-lg [animation-delay:1.5s] sm:block lg:-right-10">
      <div className="flex items-center justify-between">
        <p className="font-dm text-[11px] font-medium text-muted-foreground">Mensagens lidas</p>
        <span className="chip bg-success-soft px-1.5 py-0.5 text-[10px] text-success">
          <TrendingUp className="h-3 w-3" /> +12%
        </span>
      </div>
      <p className="mt-1 font-sora text-xl font-bold text-foreground">87%</p>
      <div className="mt-2 flex h-10 items-end gap-1" aria-hidden="true">
        {[40, 55, 48, 70, 62, 80, 92].map((h, i) => (
          <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary to-highlight" style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }} />
        ))}
      </div>
    </div>
  </div>
);
