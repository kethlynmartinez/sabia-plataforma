import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  MessageCircle,
  MessageSquareHeart,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { coursesApi, feedbackApi, usersApi, type Collaborator, type CollaboratorInput } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  PageLoader,
  ProgressBar,
  Spinner,
} from "@/components/kit";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/files";
import { formatDate, relativeTime } from "@/lib/format";
import { isEmail, isPhone, maskPhone } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types";

type StatusFilter = "todos" | "ativos" | "inativos";

const EMPTY_FORM: CollaboratorInput = { name: "", email: "", phone: "", department: "", position: "", courseIds: [] };

/* ---------------------------- Formulário (criar/editar) ---------------------------- */

const CollaboratorDialog = ({
  open,
  onOpenChange,
  editing,
  courses,
  departments,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Collaborator | null;
  courses: CourseSummary[];
  departments: string[];
  onCreated: (data: { name: string; email: string; tempPassword: string }) => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<CollaboratorInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CollaboratorInput | "form", string>>>({});
  const [lastKey, setLastKey] = useState<string | null>(null);

  // reinicia o formulário sempre que o diálogo abre para outro registro
  const key = open ? editing?.id ?? "novo" : null;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setForm(
        editing
          ? { name: editing.name, email: editing.email, phone: editing.phone, department: editing.department, position: editing.position, courseIds: editing.courseIds }
          : EMPTY_FORM,
      );
      setErrors({});
    }
  }

  const mutation = useMutation({
    mutationFn: async (): Promise<{ name: string; email: string; tempPassword?: string }> => {
      if (editing) return usersApi.update(editing.id, form);
      const { user, tempPassword } = await usersApi.create(form);
      return { name: user.name, email: user.email, tempPassword };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
      if (res.tempPassword) {
        onCreated({ name: res.name, email: res.email, tempPassword: res.tempPassword });
      } else {
        toast.success("Dados do colaborador atualizados");
      }
    },
    onError: (err: Error) => setErrors({ form: err.message }),
  });

  const set = <K extends keyof CollaboratorInput>(k: K, v: CollaboratorInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      name: form.name.trim().length < 3 ? "Informe o nome completo" : undefined,
      email: !isEmail(form.email) ? "E-mail inválido" : undefined,
      phone: !isPhone(form.phone) ? "WhatsApp inválido" : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    mutation.mutate();
  };

  const toggleCourse = (id: string) =>
    set("courseIds", form.courseIds.includes(id) ? form.courseIds.filter((c) => c !== id) : [...form.courseIds, id]);

  const isAdmin = editing?.role === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
          <DialogDescription className="font-dm">
            {editing ? "Atualize os dados e as matrículas." : "O acesso é enviado automaticamente pelo WhatsApp informado."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Nome completo" error={errors.name} htmlFor="c-name">
            <input id="c-name" className="field" value={form.name} aria-invalid={Boolean(errors.name)} onChange={(e) => set("name", e.target.value)} placeholder="Nome e sobrenome" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" error={errors.email} htmlFor="c-email">
              <input id="c-email" type="email" className="field" value={form.email} aria-invalid={Boolean(errors.email)} onChange={(e) => set("email", e.target.value)} placeholder="nome@empresa.com" />
            </Field>
            <Field label="WhatsApp" error={errors.phone} htmlFor="c-phone">
              <input id="c-phone" inputMode="tel" className="field" value={form.phone} aria-invalid={Boolean(errors.phone)} onChange={(e) => set("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Área / departamento" htmlFor="c-dep">
              <input id="c-dep" list="departments" className="field" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Ex.: Armazém" />
              <datalist id="departments">
                {departments.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
            <Field label="Cargo" htmlFor="c-pos">
              <input id="c-pos" className="field" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Ex.: Conferente" />
            </Field>
          </div>

          {!isAdmin && (
            <fieldset>
              <legend className="field-label">Matricular nos cursos</legend>
              {courses.length ? (
                <div className="grid max-h-48 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {courses.map((c) => {
                    const checked = form.courseIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 font-dm text-[13px] transition-colors",
                          checked ? "border-primary bg-primary-soft/60" : "border-border hover:border-primary/40",
                        )}
                      >
                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" checked={checked} onChange={() => toggleCourse(c.id)} />
                        <span className="min-w-0">
                          <span className="block font-semibold leading-snug text-foreground">{c.title}</span>
                          {c.status !== "publicado" && <span className="text-[11px] text-warning">Ainda não publicado</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-muted px-4 py-3 font-dm text-xs text-muted-foreground">Crie um curso para matricular colaboradores.</p>
              )}
            </fieldset>
          )}

          {errors.form && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 font-dm text-sm text-destructive" role="alert">
              {errors.form}
            </p>
          )}
          <DialogFooter>
            <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {editing ? "Salvar alterações" : "Cadastrar e enviar acesso"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------ Credenciais geradas ------------------------------ */

const CredentialsDialog = ({
  data,
  onClose,
  portalUrl,
}: {
  data: { name: string; email: string; tempPassword: string; reset?: boolean } | null;
  onClose: () => void;
  portalUrl: string;
}) => {
  const [copied, setCopied] = useState(false);
  if (!data) return null;
  const text = `Olá, ${data.name.split(" ")[0]}! Seu acesso aos treinamentos:\n${portalUrl}\nE-mail: ${data.email}\nSenha provisória: ${data.tempPassword}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-whatsapp/15 text-whatsapp">
            <MessageCircle className="h-5 w-5" />
          </span>
          <DialogTitle>{data.reset ? "Nova senha enviada" : "Acesso enviado pelo WhatsApp"}</DialogTitle>
          <DialogDescription className="font-dm">
            Na versão real, {data.name.split(" ")[0]} recebe esta mensagem automaticamente. Aqui você pode copiar os dados para testar o login.
          </DialogDescription>
        </DialogHeader>
        <pre className="whitespace-pre-wrap rounded-xl bg-[#D9FDD3] p-4 font-dm text-[13px] leading-relaxed text-[#111]">{text}</pre>
        <DialogFooter>
          <button className="btn-ghost" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar mensagem"}
          </button>
          <button className="btn-primary" onClick={onClose}>
            Concluir
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------ Feedback ------------------------------------ */

const FeedbackDialog = ({
  target,
  onClose,
  courses,
}: {
  target: Collaborator | null;
  onClose: () => void;
  courses: CourseSummary[];
}) => {
  const [message, setMessage] = useState("");
  const [courseId, setCourseId] = useState("");
  const mutation = useMutation({
    mutationFn: () => feedbackApi.sendToUser(target!.id, message, courseId),
    onSuccess: () => {
      toast.success(`Feedback enviado para ${target!.name.split(" ")[0]}`);
      setMessage("");
      setCourseId("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!target) return null;
  const userCourses = courses.filter((c) => target.courseIds.includes(c.id));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription className="font-dm">
            {target.name} verá a mensagem no painel e receberá um aviso pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Sobre o curso (opcional)" htmlFor="fb-course">
            <select id="fb-course" className="field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Feedback geral</option>
              {userCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mensagem" htmlFor="fb-msg" hint={`${message.length}/400`}>
            <textarea id="fb-msg" rows={4} maxLength={400} className="field resize-none" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reconheça uma conquista ou oriente o próximo passo…" />
          </Field>
          <DialogFooter>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={mutation.isPending || message.trim().length < 5}>
              {mutation.isPending && <Spinner />} Enviar feedback
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------- Página -------------------------------------- */

const Colaboradores = () => {
  usePageTitle("Colaboradores");
  const qc = useQueryClient();
  const { user: me, company } = useAuth();
  const users = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const courses = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; email: string; tempPassword: string; reset?: boolean } | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<Collaborator | null>(null);
  const [deleting, setDeleting] = useState<Collaborator | null>(null);

  const portalUrl = `${window.location.origin}${window.location.pathname}#/e/${company?.slug}`;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const toggleActive = useMutation({
    mutationFn: (u: Collaborator) => usersApi.setActive(u.id, !u.active),
    onSuccess: (u) => {
      invalidate();
      toast.success(u.active ? `${u.name} foi reativado(a)` : `Acesso de ${u.name} desativado`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPassword = useMutation({
    mutationFn: (u: Collaborator) => usersApi.resetPassword(u.id).then((r) => ({ ...r, u })),
    onSuccess: ({ tempPassword, u }) => setCredentials({ name: u.name, email: u.email, tempPassword, reset: true }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (u: Collaborator) => usersApi.remove(u.id),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Colaborador excluído");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = useMemo(() => users.data ?? [], [users.data]);
  const departments = useMemo(() => [...new Set(list.map((u) => u.department))].sort(), [list]);

  const filtered = list.filter((u) => {
    const q = search.trim().toLowerCase();
    const matches = !q || [u.name, u.email, u.department, u.position].some((v) => v.toLowerCase().includes(q));
    const dep = !department || u.department === department;
    const st = status === "todos" || (status === "ativos" ? u.active : !u.active);
    return matches && dep && st;
  });

  const exportCsv = () => {
    const courseTitle = (id: string) => courses.data?.find((c) => c.id === id)?.title ?? "";
    downloadCsv(
      `colaboradores-${new Date().toISOString().slice(0, 10)}`,
      ["Nome", "E-mail", "WhatsApp", "Área", "Cargo", "Perfil", "Status", "Cursos", "Concluídos", "Progresso médio (%)", "Certificados", "Último acesso", "Cadastro"],
      filtered.map((u) => [
        u.name,
        u.email,
        u.phone,
        u.department,
        u.position,
        u.role === "admin" ? "Administrador" : "Colaborador",
        u.active ? "Ativo" : "Inativo",
        u.courseIds.map(courseTitle).join(" | "),
        u.completedCount,
        u.avgProgress,
        u.certificates,
        u.lastAccessAt ? formatDate(u.lastAccessAt) : "Nunca",
        formatDate(u.createdAt),
      ]),
    );
    toast.success(`${filtered.length} registros exportados`);
  };

  if (users.isLoading) return <PageLoader />;
  if (users.isError) return <ErrorState message="Não foi possível carregar os colaboradores." onRetry={users.refetch} />;

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const actions = (u: Collaborator) => {
    const self = u.id === me?.id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="icon-btn" aria-label={`Ações para ${u.name}`}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl">
          <DropdownMenuItem
            onSelect={() => {
              setEditing(u);
              setDialogOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Editar e matrículas
          </DropdownMenuItem>
          {u.role === "aluno" && (
            <DropdownMenuItem onSelect={() => setFeedbackFor(u)}>
              <MessageSquareHeart className="mr-2 h-4 w-4" /> Enviar feedback
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => resetPassword.mutate(u)}>
            <KeyRound className="mr-2 h-4 w-4" /> Gerar nova senha
          </DropdownMenuItem>
          {!self && (
            <>
              <DropdownMenuItem onSelect={() => toggleActive.mutate(u)}>
                <Power className="mr-2 h-4 w-4" /> {u.active ? "Desativar acesso" : "Reativar acesso"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDeleting(u)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const statusChip = (u: Collaborator) => (
    <span className={cn("chip", u.active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {u.active ? "Ativo" : "Inativo"}
    </span>
  );

  return (
    <>
      <PageHeader
        title="Colaboradores"
        description="Cadastre a equipe, matricule nos cursos e acompanhe o progresso de cada pessoa."
        actions={
          <>
            <button className="btn-outline" onClick={exportCsv} disabled={!filtered.length}>
              <Download /> Exportar CSV
            </button>
            <button className="btn-primary" onClick={openNew}>
              <Plus /> Novo colaborador
            </button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
          <input className="field pl-10" placeholder="Buscar por nome, e-mail, área ou cargo" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar colaboradores" />
        </div>
        <select className="field md:w-52" value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Filtrar por área">
          <option value="">Todas as áreas</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <div className="flex rounded-[10px] border-[1.5px] border-input bg-white p-1" role="tablist" aria-label="Status">
          {(["todos", "ativos", "inativos"] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn("flex-1 rounded-[7px] px-3 py-1.5 font-dm text-[13px] font-semibold capitalize transition-colors", status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!list.length ? (
        <EmptyState icon={Users} title="Nenhum colaborador ainda" description="Cadastre a primeira pessoa da equipe. O acesso é enviado pelo WhatsApp." action={<button className="btn-primary" onClick={openNew}><Plus /> Cadastrar colaborador</button>} />
      ) : !filtered.length ? (
        <EmptyState icon={Search} title="Nenhum resultado" description="Ajuste a busca ou os filtros." />
      ) : (
        <>
          <p className="mb-3 font-dm text-xs text-muted-foreground">
            {filtered.length} de {list.length} pessoas
          </p>

          {/* Tabela (desktop) */}
          <div className="card hidden overflow-hidden xl:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Colaborador", "Área e cargo", "Cursos", "Último acesso", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 font-sora text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className={cn("transition-colors hover:bg-primary-soft/30", !u.active && "opacity-60")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-dm text-sm font-semibold text-foreground">
                            {u.name}
                            {u.role === "admin" && <span className="chip bg-highlight-soft px-2 py-0.5 text-[10px] text-foreground/70">Admin</span>}
                          </p>
                          <p className="truncate font-dm text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-dm text-[13px]">
                      <p className="text-foreground">{u.department}</p>
                      <p className="text-xs text-muted-foreground">{u.position}</p>
                    </td>
                    <td className="w-56 px-5 py-3.5">
                      {u.role === "admin" ? (
                        <span className="font-dm text-xs text-muted-foreground">—</span>
                      ) : u.courseIds.length ? (
                        <>
                          <p className="font-dm text-xs text-muted-foreground">
                            <strong className="text-foreground">{u.completedCount}</strong> de {u.courseIds.length} concluídos · {u.avgProgress}%
                          </p>
                          <ProgressBar className="mt-1.5" value={u.avgProgress} />
                        </>
                      ) : (
                        <span className="font-dm text-xs text-warning">Sem matrícula</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-dm text-[13px] text-muted-foreground">{relativeTime(u.lastAccessAt)}</td>
                    <td className="px-5 py-3.5">{statusChip(u)}</td>
                    <td className="px-3 py-3.5 text-right">{actions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões (mobile/tablet) */}
          <ul className="grid gap-3 sm:grid-cols-2 xl:hidden">
            {filtered.map((u) => (
              <li key={u.id} className={cn("card min-w-0 p-4", !u.active && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-dm text-sm font-semibold">{u.name}</p>
                    <p className="truncate font-dm text-xs text-muted-foreground">
                      {u.position} · {u.department}
                    </p>
                  </div>
                  {actions(u)}
                </div>
                {u.role === "aluno" && (
                  <div className="mt-4">
                    <div className="flex justify-between font-dm text-xs text-muted-foreground">
                      <span>
                        {u.completedCount}/{u.courseIds.length} cursos concluídos
                      </span>
                      <span>{u.avgProgress}%</span>
                    </div>
                    <ProgressBar className="mt-1.5" value={u.avgProgress} />
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  {statusChip(u)}
                  <span className="font-dm text-xs text-muted-foreground">{relativeTime(u.lastAccessAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <CollaboratorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        courses={courses.data ?? []}
        departments={departments}
        onCreated={setCredentials}
      />
      <CredentialsDialog data={credentials} onClose={() => setCredentials(null)} portalUrl={portalUrl} />
      <FeedbackDialog target={feedbackFor} onClose={() => setFeedbackFor(null)} courses={courses.data ?? []} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Excluir colaborador?"
        description={
          <>
            <strong className="text-foreground">{deleting?.name}</strong> perderá o acesso e o histórico de cursos, notas e certificados será apagado. Para
            apenas bloquear o acesso, prefira <em>desativar</em>.
          </>
        }
        confirmLabel="Excluir definitivamente"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  );
};

export default Colaboradores;
