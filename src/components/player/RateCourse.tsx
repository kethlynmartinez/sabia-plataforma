import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { feedbackApi, type FeedbackView } from "@/services/api";
import { Spinner, Stars } from "@/components/kit";

const LABELS = ["", "Precisa melhorar", "Razoável", "Bom", "Muito bom", "Excelente!"];

/** Avaliação do curso pelo colaborador (uma por curso, pode ser editada). */
export const RateCourse = ({ courseId, existing }: { courseId: string; existing?: FeedbackView }) => {
  const qc = useQueryClient();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [message, setMessage] = useState(existing?.message ?? "");
  const [editing, setEditing] = useState(!existing);

  const mutation = useMutation({
    mutationFn: () => feedbackApi.rateCourse(courseId, rating, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedbacks"] });
      toast.success("Obrigado! Sua opinião vai direto para o RH.");
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!editing && existing) {
    return (
      <div className="card p-6">
        <p className="font-sora text-sm font-semibold">Sua avaliação do curso</p>
        <div className="mt-2 flex items-center gap-2">
          <Stars value={existing.rating ?? 0} />
          <span className="font-dm text-xs text-muted-foreground">{LABELS[existing.rating ?? 0]}</span>
        </div>
        {existing.message && <p className="mt-2 font-dm text-sm text-foreground/80">“{existing.message}”</p>}
        <button className="btn-ghost btn-sm mt-3 -ml-3" onClick={() => setEditing(true)}>
          Editar avaliação
        </button>
      </div>
    );
  }

  return (
    <form
      className="card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return toast.error("Escolha de 1 a 5 estrelas");
        mutation.mutate();
      }}
    >
      <p className="font-sora text-base font-semibold">O que você achou deste curso?</p>
      <p className="mt-1 font-dm text-sm text-muted-foreground">Sua avaliação ajuda o RH a melhorar os próximos treinamentos.</p>
      <div className="mt-4 flex items-center gap-3">
        <Stars value={rating} onChange={setRating} size="lg" />
        <span className="font-dm text-sm font-semibold text-muted-foreground">{LABELS[rating]}</span>
      </div>
      <textarea rows={3} maxLength={300} className="field mt-4 resize-none" placeholder="Comentário opcional" value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Comentário" />
      <div className="mt-4 flex justify-end">
        <button className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />} Enviar avaliação
        </button>
      </div>
    </form>
  );
};
