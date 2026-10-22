import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Selo } from "@/components/brand/Selo";

/**
 * Evita a tela em branco: se uma página quebrar, mostra o aviso com opção de recarregar.
 * `selo` mostra o sabiá emburrado; fica desligado dentro dos painéis das empresas, que usam a marca do cliente.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; selo?: boolean }, { failed: boolean }> {
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
        {this.props.selo ? (
          <Selo name="erro" className="h-32 rotate-2" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
            <AlertTriangle className="h-6 w-6" />
          </span>
        )}
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
