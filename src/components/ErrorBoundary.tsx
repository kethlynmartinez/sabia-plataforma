import { Component, type ReactNode } from "react";
import { Selo } from "@/components/brand/Selo";

/** Evita a tela em branco: se uma página quebrar, mostra o aviso com opção de recarregar. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Selo name="erro" className="h-32 rotate-2" />
        <h1 className="mt-6 font-sora text-xl font-bold text-foreground">Algo deu errado ao abrir esta tela</h1>
        <p className="mt-2 max-w-sm font-dm text-sm text-muted-foreground">Recarregue a página. Se continuar, volte ao início.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
          <a href="#/" className="btn-outline">
            Ir para o início
          </a>
        </div>
      </div>
    );
  }
}
