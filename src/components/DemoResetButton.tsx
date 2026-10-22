import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { demoApi } from "@/services/api";
import { authApi } from "@/services/api";
import { ConfirmDialog } from "@/components/kit";
import { cn } from "@/lib/utils";

/** Restaura os dados fictícios — útil para quem está navegando pela demo do portfólio. */
export const DemoResetDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const reset = async () => {
    setLoading(true);
    const hadSession = Boolean(authApi.current());
    await demoApi.reset();
    queryClient.clear();
    toast.success("Dados de demonstração restaurados");
    // recarrega para reler sessão, tema e dados (contas criadas na demo deixam de existir)
    if (hadSession) {
      setTimeout(() => window.location.reload(), 500);
      return;
    }
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Restaurar dados da demonstração?"
      description="Tudo o que você criou ou alterou neste navegador (cursos, colaboradores, personalização) volta ao estado original."
      confirmLabel="Restaurar"
      tone="primary"
      loading={loading}
      onConfirm={reset}
    />
  );
};

export const DemoResetButton = ({ className, label = "Restaurar dados da demo" }: { className?: string; label?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("inline-flex items-center gap-2", className)}>
        <RotateCcw className="h-3.5 w-3.5" />
        {label}
      </button>
      <DemoResetDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
