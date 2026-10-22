import type {
  Certificate,
  Company,
  CompanyTheme,
  Course,
  CourseProgress,
  CourseSummary,
  Database,
  Enrollment,
  Feedback,
  MyCourse,
  PublicUser,
  QuizAttempt,
  Role,
  Session,
  User,
  WhatsAppDay,
} from "@/types";
import { getDb, mutate, resetDb, sessionStore } from "@/mocks/db";
import { mockHash, uid } from "@/mocks/hash";
import { BRAND } from "@/lib/brand";
import { slugify } from "@/lib/format";
import { isEmail, isPhone, passwordIssue } from "@/lib/validation";

/**
 * ============================================================
 *  Camada de API — BACK-END SIMULADO
 * ------------------------------------------------------------
 *  Todas as telas falam apenas com este módulo. Cada função
 *  corresponde a um endpoint REST (comentado acima dela) e
 *  aplica as mesmas regras que o servidor aplicaria:
 *  autenticação, escopo por empresa (multi-tenant), papéis
 *  e validações. Para ligar num back real, basta trocar a
 *  implementação destas funções por chamadas HTTP.
 * ============================================================
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const latency = () => 160 + Math.random() * 260;
const wait = (ms = latency()) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(v: T): T => structuredClone(v);

/** Simula a ida ao servidor: espera, executa a regra e devolve uma cópia. */
async function request<T>(handler: () => T, ms?: number): Promise<T> {
  await wait(ms);
  return clone(handler());
}

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

/* ----------------------------- helpers de domínio ----------------------------- */

const toPublic = ({ passwordHash: _ignored, ...u }: User): PublicUser => u;

const requireSession = (role?: Role): Session => {
  const s = sessionStore.read();
  if (!s) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  const user = getDb().users.find((u) => u.id === s.userId);
  if (!user || !user.active) {
    sessionStore.clear();
    throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  }
  if (role && s.role !== role) throw new ApiError("Você não tem permissão para esta ação.", 403);
  return s;
};

const companyOf = (db: Database, id: string) => {
  const c = db.companies.find((x) => x.id === id);
  if (!c) throw new ApiError("Empresa não encontrada", 404);
  return c;
};

const courseOf = (db: Database, companyId: string, id: string) => {
  const c = db.courses.find((x) => x.id === id && x.companyId === companyId);
  if (!c) throw new ApiError("Curso não encontrado", 404);
  return c;
};

const userOf = (db: Database, companyId: string, id: string) => {
  const u = db.users.find((x) => x.id === id && x.companyId === companyId);
  if (!u) throw new ApiError("Colaborador não encontrado", 404);
  return u;
};

const lessonIds = (c: Course) => c.modules.flatMap((m) => m.lessons.map((l) => l.id));

const progressOf = (c: Course, e: Enrollment): CourseProgress => {
  const ids = lessonIds(c);
  const done = e.completedLessonIds.filter((id) => ids.includes(id)).length;
  return {
    totalLessons: ids.length,
    completedLessons: done,
    percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
  };
};

const buildMyCourse = (db: Database, c: Course, e: Enrollment): MyCourse => {
  const attempts = db.attempts
    .filter((a) => a.userId === e.userId && a.courseId === c.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
  return {
    course: c,
    enrollment: e,
    progress: progressOf(c, e),
    attempts,
    bestScore: best,
    passed: attempts.some((a) => a.passed),
    certificate: db.certificates.find((x) => x.userId === e.userId && x.courseId === c.id),
  };
};

/** Conclui o curso e emite certificado quando todas as regras são atendidas. */
const tryComplete = (db: Database, c: Course, e: Enrollment): Certificate | undefined => {
  const p = progressOf(c, e);
  if (p.totalLessons === 0 || p.completedLessons < p.totalLessons) return;
  if (c.quiz.enabled && !db.attempts.some((a) => a.userId === e.userId && a.courseId === c.id && a.passed)) return;
  if (!e.completedAt) e.completedAt = now();
  const existing = db.certificates.find((x) => x.userId === e.userId && x.courseId === c.id);
  if (existing) return existing;
  const company = companyOf(db, c.companyId);
  const cert: Certificate = {
    id: uid("cert"),
    companyId: c.companyId,
    userId: e.userId,
    courseId: c.id,
    code: `${company.slug.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    issuedAt: now(),
  };
  db.certificates.push(cert);
  return cert;
};

const bumpWhatsApp = (db: Database, companyId: string, sent: number) => {
  if (sent <= 0) return;
  let day = db.whatsapp.find((d) => d.companyId === companyId && d.date === today());
  if (!day) {
    day = { companyId, date: today(), sent: 0, read: 0, replied: 0 };
    db.whatsapp.push(day);
  }
  day.sent += sent;
  // a simulação considera leitura imediata de parte das mensagens
  day.read += Math.round(sent * 0.8);
  day.replied += Math.round(sent * 0.25);
};

const tempPassword = () => {
  const words = ["rota", "carga", "trilha", "foco", "meta", "turno"];
  return `${words[Math.floor(Math.random() * words.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
};

const startSession = (db: Database, user: User): Session => {
  user.lastAccessAt = now();
  const session: Session = {
    token: `mock.${btoa(user.id)}.${Math.random().toString(36).slice(2)}`,
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  sessionStore.write(session);
  return session;
};

export interface AuthPayload {
  session: Session;
  user: PublicUser;
  company: Company;
}

/* =================================== AUTH =================================== */

export const authApi = {
  /** Leitura síncrona da sessão atual (equivale a validar o token no boot do app). */
  current(): AuthPayload | null {
    const session = sessionStore.read();
    if (!session) return null;
    const db = getDb();
    const user = db.users.find((u) => u.id === session.userId);
    const company = db.companies.find((c) => c.id === session.companyId);
    if (!user || !company || !user.active) {
      sessionStore.clear();
      return null;
    }
    return clone({ session, user: toPublic(user), company });
  },

  /** POST /auth/login  (companySlug restringe o login ao portal de uma empresa) */
  login(email: string, password: string, companySlug?: string) {
    return request<AuthPayload>(() =>
      mutate((db) => {
        const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user || user.passwordHash !== mockHash(password)) {
          throw new ApiError("E-mail ou senha incorretos", 401);
        }
        const company = companyOf(db, user.companyId);
        if (companySlug && company.slug !== companySlug) {
          throw new ApiError("Este e-mail não está cadastrado neste portal.", 403);
        }
        if (!user.active) {
          throw new ApiError("Seu acesso está desativado. Fale com o RH da sua empresa.", 403);
        }
        const session = startSession(db, user);
        return { session, user: toPublic(user), company };
      }),
    );
  },

  /** POST /auth/logout */
  logout() {
    sessionStore.clear();
  },

  /** POST /companies  — cadastro self-service da empresa + usuário administrador */
  registerCompany(input: {
    companyName: string;
    segment: string;
    size: string;
    whatsapp: string;
    adminName: string;
    email: string;
    password: string;
  }) {
    return request<AuthPayload>(() =>
      mutate((db) => {
        if (input.companyName.trim().length < 2) throw new ApiError("Informe o nome da empresa");
        if (!isEmail(input.email)) throw new ApiError("E-mail inválido");
        if (!isPhone(input.whatsapp)) throw new ApiError("WhatsApp inválido");
        const pwd = passwordIssue(input.password);
        if (pwd) throw new ApiError(pwd);
        const email = input.email.trim().toLowerCase();
        if (db.users.some((u) => u.email.toLowerCase() === email)) {
          throw new ApiError("Já existe uma conta com este e-mail", 409);
        }
        const base = slugify(input.companyName) || "empresa";
        let slug = base;
        for (let i = 2; db.companies.some((c) => c.slug === slug); i++) slug = `${base}-${i}`;

        const company: Company = {
          id: uid("c"),
          slug,
          name: input.companyName.trim(),
          segment: input.segment,
          size: input.size,
          whatsapp: input.whatsapp,
          createdAt: now(),
          theme: {
            displayName: `${input.companyName.trim()} Aprende`,
            primary: BRAND.theme.primary,
            highlight: BRAND.theme.highlight,
            loginTitle: "Bons estudos começam aqui.",
            loginSubtitle: "Acesse seus cursos, avaliações e certificados.",
          },
        };
        const admin: User = {
          id: uid("u"),
          companyId: company.id,
          role: "admin",
          name: input.adminName.trim(),
          email,
          phone: input.whatsapp,
          passwordHash: mockHash(input.password),
          department: "Recursos Humanos",
          position: "Administrador(a) da plataforma",
          active: true,
          whatsappOptIn: true,
          createdAt: now(),
        };
        db.companies.push(company);
        db.users.push(admin);
        const session = startSession(db, admin);
        return { session, user: toPublic(admin), company };
      }),
      700,
    );
  },

  /** POST /auth/forgot-password — sempre responde igual para não revelar e-mails */
  requestPasswordReset(_email: string) {
    return request(() => ({ ok: true }), 600);
  },

  /** PUT /me/password */
  changePassword(current: string, next: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession();
        const user = db.users.find((u) => u.id === s.userId)!;
        if (user.passwordHash !== mockHash(current)) throw new ApiError("Senha atual incorreta");
        const issue = passwordIssue(next);
        if (issue) throw new ApiError(issue);
        user.passwordHash = mockHash(next);
        return { ok: true };
      }),
    );
  },

  /** PUT /me */
  updateProfile(data: Partial<Pick<User, "name" | "phone" | "bio" | "whatsappOptIn">>) {
    return request(() =>
      mutate((db) => {
        const s = requireSession();
        const user = db.users.find((u) => u.id === s.userId)!;
        if (data.name !== undefined && data.name.trim().length < 3) throw new ApiError("Informe seu nome completo");
        if (data.phone !== undefined && !isPhone(data.phone)) throw new ApiError("Telefone inválido");
        Object.assign(user, {
          ...data,
          name: data.name?.trim() ?? user.name,
          bio: data.bio?.slice(0, 300) ?? user.bio,
        });
        return toPublic(user);
      }),
    );
  },
};

/* ================================== EMPRESA ================================== */

export const companyApi = {
  /** GET /public/companies/:slug — dados públicos do portal de login */
  getPublic(slug: string) {
    return request(() => {
      const c = getDb().companies.find((x) => x.slug === slug);
      if (!c) throw new ApiError("Portal não encontrado", 404);
      return { name: c.name, slug: c.slug, theme: c.theme };
    }, 120);
  },

  /** PUT /company */
  update(data: Pick<Company, "name" | "segment" | "size" | "whatsapp">) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        const c = companyOf(db, s.companyId);
        if (data.name.trim().length < 2) throw new ApiError("Informe o nome da empresa");
        if (!isPhone(data.whatsapp)) throw new ApiError("WhatsApp inválido");
        Object.assign(c, { ...data, name: data.name.trim() });
        return c;
      }),
    );
  },

  /** PUT /company/theme */
  updateTheme(theme: CompanyTheme) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        const c = companyOf(db, s.companyId);
        if (theme.displayName.trim().length < 2) throw new ApiError("Informe o nome da plataforma");
        c.theme = { ...theme, displayName: theme.displayName.trim() };
        return c;
      }),
      450,
    );
  },
};

/* =============================== COLABORADORES =============================== */

export interface Collaborator extends PublicUser {
  courseIds: string[];
  completedCount: number;
  avgProgress: number;
  certificates: number;
}

export interface CollaboratorInput {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  courseIds: string[];
}

const syncEnrollments = (db: Database, companyId: string, userId: string, courseIds: string[]) => {
  const current = db.enrollments.filter((e) => e.userId === userId);
  db.enrollments = db.enrollments.filter((e) => e.userId !== userId || courseIds.includes(e.courseId));
  courseIds.forEach((courseId) => {
    if (!current.some((e) => e.courseId === courseId)) {
      courseOf(db, companyId, courseId);
      db.enrollments.push({
        id: uid("e"),
        companyId,
        userId,
        courseId,
        completedLessonIds: [],
        enrolledAt: now(),
      });
    }
  });
};

const validateCollaborator = (db: Database, input: CollaboratorInput, ignoreId?: string) => {
  if (input.name.trim().length < 3) throw new ApiError("Informe o nome completo");
  if (!isEmail(input.email)) throw new ApiError("E-mail inválido");
  if (!isPhone(input.phone)) throw new ApiError("WhatsApp inválido");
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email && u.id !== ignoreId)) {
    throw new ApiError("Já existe um usuário com este e-mail", 409);
  }
};

export const usersApi = {
  /** GET /users */
  list() {
    return request<Collaborator[]>(() => {
      const s = requireSession("admin");
      const db = getDb();
      return db.users
        .filter((u) => u.companyId === s.companyId)
        .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "admin" ? -1 : 1))
        .map((u) => {
          const enr = db.enrollments.filter((e) => e.userId === u.id);
          const progresses = enr.map((e) => {
            const c = db.courses.find((x) => x.id === e.courseId);
            return c ? progressOf(c, e).percent : 0;
          });
          return {
            ...toPublic(u),
            courseIds: enr.map((e) => e.courseId),
            completedCount: enr.filter((e) => e.completedAt).length,
            avgProgress: progresses.length ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0,
            certificates: db.certificates.filter((c) => c.userId === u.id).length,
          };
        });
    });
  },

  /** POST /users — cria o colaborador, matricula e "envia" o convite por WhatsApp */
  create(input: CollaboratorInput) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        validateCollaborator(db, input);
        const password = tempPassword();
        const user: User = {
          id: uid("u"),
          companyId: s.companyId,
          role: "aluno",
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone,
          department: input.department.trim() || "Geral",
          position: input.position.trim() || "Colaborador(a)",
          passwordHash: mockHash(password),
          active: true,
          whatsappOptIn: true,
          createdAt: now(),
        };
        db.users.push(user);
        syncEnrollments(db, s.companyId, user.id, input.courseIds);
        bumpWhatsApp(db, s.companyId, 1);
        return { user: toPublic(user), tempPassword: password };
      }),
      500,
    );
  },

  /** PUT /users/:id */
  update(id: string, input: CollaboratorInput) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        const user = userOf(db, s.companyId, id);
        validateCollaborator(db, input, id);
        Object.assign(user, {
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone,
          department: input.department.trim() || user.department,
          position: input.position.trim() || user.position,
        });
        if (user.role === "aluno") syncEnrollments(db, s.companyId, id, input.courseIds);
        return toPublic(user);
      }),
    );
  },

  /** PATCH /users/:id/status */
  setActive(id: string, active: boolean) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        if (id === s.userId) throw new ApiError("Você não pode desativar o próprio acesso");
        const user = userOf(db, s.companyId, id);
        user.active = active;
        return toPublic(user);
      }),
    );
  },

  /** POST /users/:id/reset-password */
  resetPassword(id: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        const user = userOf(db, s.companyId, id);
        const password = tempPassword();
        user.passwordHash = mockHash(password);
        bumpWhatsApp(db, s.companyId, 1);
        return { tempPassword: password };
      }),
    );
  },

  /** DELETE /users/:id */
  remove(id: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        if (id === s.userId) throw new ApiError("Você não pode excluir a própria conta");
        userOf(db, s.companyId, id);
        db.users = db.users.filter((u) => u.id !== id);
        db.enrollments = db.enrollments.filter((e) => e.userId !== id);
        db.attempts = db.attempts.filter((a) => a.userId !== id);
        db.certificates = db.certificates.filter((c) => c.userId !== id);
        db.feedbacks = db.feedbacks.filter((f) => f.userId !== id);
        return { ok: true };
      }),
    );
  },
};

/* =================================== CURSOS =================================== */

export type CourseDraft = Omit<Course, "id" | "companyId" | "createdAt" | "updatedAt"> & { id?: string };

const validateCourse = (c: CourseDraft) => {
  if (c.title.trim().length < 3) throw new ApiError("O título precisa de pelo menos 3 caracteres");
  if (!c.category.trim()) throw new ApiError("Escolha uma categoria");
  c.modules.forEach((m, mi) => {
    if (!m.title.trim()) throw new ApiError(`Dê um nome ao módulo ${mi + 1}`);
    m.lessons.forEach((l, li) => {
      if (!l.title.trim()) throw new ApiError(`Dê um título à aula ${li + 1} do módulo "${m.title}"`);
    });
  });
  if (c.status === "publicado" && !c.modules.some((m) => m.lessons.length > 0)) {
    throw new ApiError("Adicione pelo menos uma aula antes de publicar");
  }
  if (c.quiz.enabled) {
    if (c.quiz.questions.length === 0) throw new ApiError("A avaliação está ativa, mas não tem perguntas");
    c.quiz.questions.forEach((q, i) => {
      if (!q.prompt.trim()) throw new ApiError(`Escreva o enunciado da pergunta ${i + 1}`);
      if (q.options.filter((o) => o.trim()).length < 2 || q.options.some((o) => !o.trim())) {
        throw new ApiError(`Preencha todas as alternativas da pergunta ${i + 1} (mínimo 2)`);
      }
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        throw new ApiError(`Marque a alternativa correta da pergunta ${i + 1}`);
      }
    });
  }
};

export interface EnrollmentRow {
  user: PublicUser;
  enrolled: boolean;
  progress: number;
  completedAt?: string;
  bestScore: number | null;
}

export const coursesApi = {
  /** GET /courses */
  list() {
    return request<CourseSummary[]>(() => {
      const s = requireSession("admin");
      const db = getDb();
      return db.courses
        .filter((c) => c.companyId === s.companyId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((c) => {
          const enr = db.enrollments.filter((e) => e.courseId === c.id);
          const ratings = db.feedbacks.filter((f) => f.courseId === c.id && f.rating).map((f) => f.rating!);
          return {
            ...c,
            enrolledCount: enr.length,
            completedCount: enr.filter((e) => e.completedAt).length,
            lessonsCount: lessonIds(c).length,
            avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
          };
        });
    });
  },

  /** GET /courses/:id */
  get(id: string) {
    return request<Course>(() => {
      const s = requireSession("admin");
      return courseOf(getDb(), s.companyId, id);
    });
  },

  /** POST /courses  ·  PUT /courses/:id */
  save(draft: CourseDraft) {
    return request<Course>(() =>
      mutate((db) => {
        const s = requireSession("admin");
        validateCourse(draft);
        if (draft.id) {
          const existing = courseOf(db, s.companyId, draft.id);
          Object.assign(existing, { ...draft, title: draft.title.trim(), updatedAt: now() });
          // matrículas que agora cumprem as regras são concluídas (ex.: avaliação desativada)
          db.enrollments.filter((e) => e.courseId === existing.id).forEach((e) => tryComplete(db, existing, e));
          return existing;
        }
        const course: Course = {
          ...draft,
          id: uid("crs"),
          companyId: s.companyId,
          title: draft.title.trim(),
          createdAt: now(),
          updatedAt: now(),
        };
        db.courses.push(course);
        return course;
      }),
      450,
    );
  },

  /** DELETE /courses/:id */
  remove(id: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        courseOf(db, s.companyId, id);
        db.courses = db.courses.filter((c) => c.id !== id);
        db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
        db.attempts = db.attempts.filter((a) => a.courseId !== id);
        db.certificates = db.certificates.filter((c) => c.courseId !== id);
        db.feedbacks = db.feedbacks.filter((f) => f.courseId !== id);
        return { ok: true };
      }),
    );
  },

  /** GET /courses/:id/enrollments */
  enrollments(courseId: string) {
    return request<EnrollmentRow[]>(() => {
      const s = requireSession("admin");
      const db = getDb();
      const course = courseOf(db, s.companyId, courseId);
      return db.users
        .filter((u) => u.companyId === s.companyId && u.role === "aluno")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((u) => {
          const e = db.enrollments.find((x) => x.userId === u.id && x.courseId === courseId);
          const scores = db.attempts.filter((a) => a.userId === u.id && a.courseId === courseId).map((a) => a.score);
          return {
            user: toPublic(u),
            enrolled: Boolean(e),
            progress: e ? progressOf(course, e).percent : 0,
            completedAt: e?.completedAt,
            bestScore: scores.length ? Math.max(...scores) : null,
          };
        });
    });
  },

  /** PUT /courses/:id/enrollments */
  setEnrollments(courseId: string, userIds: string[]) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        courseOf(db, s.companyId, courseId);
        const before = db.enrollments.filter((e) => e.courseId === courseId).map((e) => e.userId);
        db.enrollments = db.enrollments.filter((e) => e.courseId !== courseId || userIds.includes(e.userId));
        const added = userIds.filter((id) => !before.includes(id));
        added.forEach((userId) => {
          userOf(db, s.companyId, userId);
          db.enrollments.push({ id: uid("e"), companyId: s.companyId, userId, courseId, completedLessonIds: [], enrolledAt: now() });
        });
        bumpWhatsApp(db, s.companyId, added.length);
        return { added: added.length, removed: before.filter((id) => !userIds.includes(id)).length };
      }),
    );
  },

  /** POST /courses/:id/whatsapp-reminder — lembrete para quem ainda não concluiu */
  sendReminder(courseId: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        const course = courseOf(db, s.companyId, courseId);
        if (course.status !== "publicado") throw new ApiError("Publique o curso antes de enviar lembretes");
        const recipients = db.enrollments.filter((e) => {
          if (e.courseId !== courseId || e.completedAt) return false;
          const u = db.users.find((x) => x.id === e.userId);
          return u?.active && u.whatsappOptIn;
        }).length;
        if (!recipients) throw new ApiError("Nenhum colaborador pendente com WhatsApp ativo neste curso");
        bumpWhatsApp(db, s.companyId, recipients);
        return { recipients };
      }),
      700,
    );
  },
};

/* ============================ ÁREA DO COLABORADOR ============================ */

export interface QuizResult {
  attempt: QuizAttempt;
  attemptsLeft: number;
  certificate?: Certificate;
  correctIndexes: number[];
}

export const learningApi = {
  /** GET /me/courses */
  myCourses() {
    return request<MyCourse[]>(() => {
      const s = requireSession("aluno");
      const db = getDb();
      return db.enrollments
        .filter((e) => e.userId === s.userId)
        .map((e) => ({ e, c: db.courses.find((c) => c.id === e.courseId) }))
        .filter(({ c, e }) => c && (c.status === "publicado" || e.completedAt))
        .map(({ c, e }) => buildMyCourse(db, c!, e))
        .sort((a, b) => (b.enrollment.lastLessonId ? 1 : 0) - (a.enrollment.lastLessonId ? 1 : 0));
    });
  },

  /** GET /me/courses/:id */
  myCourse(courseId: string) {
    return request<MyCourse>(() => {
      const s = requireSession("aluno");
      const db = getDb();
      const e = db.enrollments.find((x) => x.userId === s.userId && x.courseId === courseId);
      const c = db.courses.find((x) => x.id === courseId && x.companyId === s.companyId);
      if (!e || !c || (c.status !== "publicado" && !e.completedAt)) {
        throw new ApiError("Você não está matriculado neste curso", 404);
      }
      return buildMyCourse(db, c, e);
    });
  },

  /** POST /me/courses/:id/lessons/:lessonId/complete */
  completeLesson(courseId: string, lessonId: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("aluno");
        const e = db.enrollments.find((x) => x.userId === s.userId && x.courseId === courseId);
        const c = db.courses.find((x) => x.id === courseId);
        if (!e || !c) throw new ApiError("Matrícula não encontrada", 404);
        if (!lessonIds(c).includes(lessonId)) throw new ApiError("Aula não encontrada", 404);
        if (!e.completedLessonIds.includes(lessonId)) e.completedLessonIds.push(lessonId);
        e.lastLessonId = lessonId;
        const certificate = tryComplete(db, c, e);
        return { myCourse: buildMyCourse(db, c, e), certificate };
      }),
      220,
    );
  },

  /** PUT /me/courses/:id/last-lesson — retomar de onde parou */
  setLastLesson(courseId: string, lessonId: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("aluno");
        const e = db.enrollments.find((x) => x.userId === s.userId && x.courseId === courseId);
        if (e) e.lastLessonId = lessonId;
        return { ok: true };
      }),
      60,
    );
  },

  /** POST /me/courses/:id/quiz */
  submitQuiz(courseId: string, answers: number[]) {
    return request<QuizResult>(() =>
      mutate((db) => {
        const s = requireSession("aluno");
        const e = db.enrollments.find((x) => x.userId === s.userId && x.courseId === courseId);
        const c = db.courses.find((x) => x.id === courseId);
        if (!e || !c) throw new ApiError("Matrícula não encontrada", 404);
        if (!c.quiz.enabled) throw new ApiError("Este curso não tem avaliação");
        const p = progressOf(c, e);
        if (p.completedLessons < p.totalLessons) throw new ApiError("Conclua todas as aulas para liberar a avaliação");
        const prev = db.attempts.filter((a) => a.userId === s.userId && a.courseId === courseId);
        if (prev.some((a) => a.passed)) throw new ApiError("Você já foi aprovado nesta avaliação");
        if (prev.length >= c.quiz.maxAttempts) throw new ApiError("Você usou todas as tentativas. Fale com o RH.");
        if (answers.length !== c.quiz.questions.length || answers.some((a) => a < 0)) {
          throw new ApiError("Responda todas as perguntas");
        }
        const right = c.quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length;
        const score = Math.round((right / c.quiz.questions.length) * 100);
        const attempt: QuizAttempt = {
          id: uid("a"),
          companyId: s.companyId,
          userId: s.userId,
          courseId,
          answers,
          score,
          passed: score >= c.quiz.passingScore,
          createdAt: now(),
        };
        db.attempts.push(attempt);
        const certificate = attempt.passed ? tryComplete(db, c, e) : undefined;
        return {
          attempt,
          attemptsLeft: c.quiz.maxAttempts - prev.length - 1,
          certificate,
          correctIndexes: c.quiz.questions.map((q) => q.correctIndex),
        };
      }),
      650,
    );
  },
};

/* ================================ CERTIFICADOS ================================ */

export interface CertificateView {
  certificate: Certificate;
  course: Pick<Course, "id" | "title" | "workloadHours" | "category" | "coverUrl">;
  user: Pick<PublicUser, "name">;
  company: Pick<Company, "name" | "theme">;
  score: number | null;
}

const certificateView = (db: Database, cert: Certificate): CertificateView => {
  const course = db.courses.find((c) => c.id === cert.courseId)!;
  const user = db.users.find((u) => u.id === cert.userId)!;
  const company = companyOf(db, cert.companyId);
  const scores = db.attempts.filter((a) => a.userId === cert.userId && a.courseId === cert.courseId).map((a) => a.score);
  return {
    certificate: cert,
    course: { id: course.id, title: course.title, workloadHours: course.workloadHours, category: course.category, coverUrl: course.coverUrl },
    user: { name: user.name },
    company: { name: company.name, theme: company.theme },
    score: scores.length ? Math.max(...scores) : null,
  };
};

export const certificatesApi = {
  /** GET /me/certificates */
  mine() {
    return request<CertificateView[]>(() => {
      const s = requireSession("aluno");
      const db = getDb();
      return db.certificates
        .filter((c) => c.userId === s.userId && db.courses.some((x) => x.id === c.courseId))
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
        .map((c) => certificateView(db, c));
    });
  },

  /** GET /certificates/:id */
  get(id: string) {
    return request<CertificateView>(() => {
      const s = requireSession();
      const db = getDb();
      const cert = db.certificates.find((c) => c.id === id && c.companyId === s.companyId);
      if (!cert || (s.role === "aluno" && cert.userId !== s.userId)) throw new ApiError("Certificado não encontrado", 404);
      return certificateView(db, cert);
    });
  },
};

/* ================================= FEEDBACKS ================================= */

export interface FeedbackView extends Feedback {
  authorName: string;
  userName: string;
  courseTitle?: string;
}

const feedbackView = (db: Database, f: Feedback): FeedbackView => ({
  ...f,
  authorName: db.users.find((u) => u.id === f.authorId)?.name ?? "Equipe",
  userName: db.users.find((u) => u.id === f.userId)?.name ?? "Colaborador",
  courseTitle: db.courses.find((c) => c.id === f.courseId)?.title,
});

export const feedbackApi = {
  /** POST /users/:id/feedbacks — empresa → colaborador */
  sendToUser(userId: string, message: string, courseId?: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("admin");
        userOf(db, s.companyId, userId);
        if (message.trim().length < 5) throw new ApiError("Escreva uma mensagem um pouco maior");
        const f: Feedback = {
          id: uid("f"),
          companyId: s.companyId,
          kind: "empresa_para_aluno",
          authorId: s.userId,
          userId,
          courseId: courseId || undefined,
          message: message.trim(),
          createdAt: now(),
        };
        db.feedbacks.push(f);
        bumpWhatsApp(db, s.companyId, 1);
        return f;
      }),
    );
  },

  /** PUT /me/courses/:id/rating — colaborador → curso (uma avaliação por curso) */
  rateCourse(courseId: string, rating: number, message: string) {
    return request(() =>
      mutate((db) => {
        const s = requireSession("aluno");
        if (!db.enrollments.some((e) => e.userId === s.userId && e.courseId === courseId)) {
          throw new ApiError("Você não está matriculado neste curso", 403);
        }
        if (rating < 1 || rating > 5) throw new ApiError("Escolha de 1 a 5 estrelas");
        const existing = db.feedbacks.find(
          (f) => f.kind === "aluno_para_curso" && f.userId === s.userId && f.courseId === courseId,
        );
        if (existing) {
          Object.assign(existing, { rating, message: message.trim(), createdAt: now() });
          return existing;
        }
        const f: Feedback = {
          id: uid("f"),
          companyId: s.companyId,
          kind: "aluno_para_curso",
          authorId: s.userId,
          userId: s.userId,
          courseId,
          rating,
          message: message.trim(),
          createdAt: now(),
        };
        db.feedbacks.push(f);
        return f;
      }),
    );
  },

  /** GET /me/feedbacks */
  mine() {
    return request<{ received: FeedbackView[]; sent: FeedbackView[] }>(() => {
      const s = requireSession("aluno");
      const db = getDb();
      const own = db.feedbacks
        .filter((f) => f.userId === s.userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((f) => feedbackView(db, f));
      return {
        received: own.filter((f) => f.kind === "empresa_para_aluno"),
        sent: own.filter((f) => f.kind === "aluno_para_curso"),
      };
    });
  },

  /** GET /feedbacks — avaliações dos cursos feitas pelos colaboradores */
  company() {
    return request<FeedbackView[]>(() => {
      const s = requireSession("admin");
      const db = getDb();
      return db.feedbacks
        .filter((f) => f.companyId === s.companyId && f.kind === "aluno_para_curso")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((f) => feedbackView(db, f));
    });
  },
};

/* ================================= AVALIAÇÕES ================================= */

export interface AttemptRow extends QuizAttempt {
  userName: string;
  department: string;
  courseTitle: string;
  passingScore: number;
}

export interface AssessmentSummary {
  courseId: string;
  title: string;
  coverUrl: string;
  passingScore: number;
  questions: number;
  attempts: number;
  avgScore: number | null;
  approvalRate: number | null;
  awaiting: number;
}

export const assessmentsApi = {
  /** GET /assessments/results */
  results() {
    return request<{ summary: AssessmentSummary[]; attempts: AttemptRow[] }>(() => {
      const s = requireSession("admin");
      const db = getDb();
      const courses = db.courses.filter((c) => c.companyId === s.companyId && c.quiz.enabled);
      const attempts = db.attempts
        .filter((a) => a.companyId === s.companyId && courses.some((c) => c.id === a.courseId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((a) => {
          const u = db.users.find((x) => x.id === a.userId);
          const c = courses.find((x) => x.id === a.courseId)!;
          return {
            ...a,
            userName: u?.name ?? "—",
            department: u?.department ?? "—",
            courseTitle: c.title,
            passingScore: c.quiz.passingScore,
          };
        });
      const summary = courses.map((c) => {
        const list = attempts.filter((a) => a.courseId === c.id);
        const users = [...new Set(list.map((a) => a.userId))];
        const approved = users.filter((u) => list.some((a) => a.userId === u && a.passed)).length;
        const awaiting = db.enrollments.filter((e) => {
          if (e.courseId !== c.id) return false;
          const p = progressOf(c, e);
          return p.totalLessons > 0 && p.completedLessons === p.totalLessons && !list.some((a) => a.userId === e.userId && a.passed);
        }).length;
        return {
          courseId: c.id,
          title: c.title,
          coverUrl: c.coverUrl,
          passingScore: c.quiz.passingScore,
          questions: c.quiz.questions.length,
          attempts: list.length,
          avgScore: list.length ? Math.round(list.reduce((a, b) => a + b.score, 0) / list.length) : null,
          approvalRate: users.length ? Math.round((approved / users.length) * 100) : null,
          awaiting,
        };
      });
      return { summary, attempts };
    });
  },
};

/* ================================= DASHBOARDS ================================= */

export interface ActivityItem {
  id: string;
  type: "certificado" | "reprovado" | "aprovado" | "novo";
  text: string;
  at: string;
}

export interface AdminOverview {
  stats: {
    activeUsers: number;
    totalUsers: number;
    publishedCourses: number;
    draftCourses: number;
    completionRate: number;
    certificates: number;
    certificatesLast30: number;
    avgScore: number | null;
  };
  whatsapp: { days: WhatsAppDay[]; sent: number; read: number; replied: number; readRate: number };
  courseProgress: { courseId: string; title: string; enrolled: number; completed: number; rate: number }[];
  activity: ActivityItem[];
  onboarding: { brand: boolean; users: boolean; course: boolean; published: boolean; enrollments: boolean };
}

export const dashboardApi = {
  /** GET /dashboard?days= */
  admin(days: number) {
    return request<AdminOverview>(() => {
      const s = requireSession("admin");
      const db = getDb();
      const company = companyOf(db, s.companyId);
      const users = db.users.filter((u) => u.companyId === s.companyId && u.role === "aluno");
      const courses = db.courses.filter((c) => c.companyId === s.companyId);
      const enr = db.enrollments.filter((e) => e.companyId === s.companyId);
      const certs = db.certificates.filter((c) => c.companyId === s.companyId);
      const attempts = db.attempts.filter((a) => a.companyId === s.companyId);
      const since = Date.now() - days * 86_400_000;
      const waDays = db.whatsapp
        .filter((d) => d.companyId === s.companyId && new Date(d.date).getTime() >= since - 86_400_000)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-days);
      const sum = (k: "sent" | "read" | "replied") => waDays.reduce((a, d) => a + d[k], 0);

      const name = (id: string) => db.users.find((u) => u.id === id)?.name ?? "Colaborador";
      const title = (id: string) => db.courses.find((c) => c.id === id)?.title ?? "curso";
      const activity: ActivityItem[] = [
        ...certs.map((c) => ({ id: c.id, type: "certificado" as const, text: `${name(c.userId)} concluiu ${title(c.courseId)}`, at: c.issuedAt })),
        ...attempts
          .filter((a) => !a.passed)
          .map((a) => ({ id: a.id, type: "reprovado" as const, text: `${name(a.userId)} não atingiu a nota em ${title(a.courseId)} (${a.score}%)`, at: a.createdAt })),
        ...users.map((u) => ({ id: u.id, type: "novo" as const, text: `${u.name} foi cadastrado(a)`, at: u.createdAt })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 6);

      return {
        stats: {
          activeUsers: users.filter((u) => u.active).length,
          totalUsers: users.length,
          publishedCourses: courses.filter((c) => c.status === "publicado").length,
          draftCourses: courses.filter((c) => c.status === "rascunho").length,
          completionRate: enr.length ? Math.round((enr.filter((e) => e.completedAt).length / enr.length) * 100) : 0,
          certificates: certs.length,
          certificatesLast30: certs.filter((c) => new Date(c.issuedAt).getTime() > Date.now() - 30 * 86_400_000).length,
          avgScore: attempts.length ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length) : null,
        },
        whatsapp: {
          days: waDays,
          sent: sum("sent"),
          read: sum("read"),
          replied: sum("replied"),
          readRate: sum("sent") ? Math.round((sum("read") / sum("sent")) * 100) : 0,
        },
        courseProgress: courses
          .filter((c) => c.status === "publicado")
          .map((c) => {
            const list = enr.filter((e) => e.courseId === c.id);
            const completed = list.filter((e) => e.completedAt).length;
            return { courseId: c.id, title: c.title, enrolled: list.length, completed, rate: list.length ? Math.round((completed / list.length) * 100) : 0 };
          })
          .sort((a, b) => b.enrolled - a.enrolled),
        activity,
        onboarding: {
          brand: company.theme.primary.toUpperCase() !== BRAND.theme.primary || Boolean(company.theme.logoUrl),
          users: users.length > 0,
          course: courses.length > 0,
          published: courses.some((c) => c.status === "publicado"),
          enrollments: enr.length > 0,
        },
      };
    });
  },

  /** GET /me/dashboard */
  aluno() {
    return request(() => {
      const s = requireSession("aluno");
      const db = getDb();
      const mine = db.enrollments
        .filter((e) => e.userId === s.userId)
        .map((e) => ({ e, c: db.courses.find((c) => c.id === e.courseId) }))
        .filter(({ c, e }) => c && (c.status === "publicado" || e.completedAt))
        .map(({ c, e }) => buildMyCourse(db, c!, e));
      const inProgress = mine.filter((m) => !m.enrollment.completedAt);
      const awaitingQuiz = inProgress.filter(
        (m) =>
          m.course.quiz.enabled &&
          m.progress.totalLessons > 0 &&
          m.progress.completedLessons === m.progress.totalLessons &&
          !m.passed &&
          m.attempts.length < m.course.quiz.maxAttempts,
      );
      // carga horária oficial dos cursos concluídos (a mesma que vai no certificado)
      const certifiedHours = mine.filter((m) => m.enrollment.completedAt).reduce((acc, m) => acc + m.course.workloadHours, 0);
      return {
        stats: {
          enrolled: mine.length,
          completed: mine.filter((m) => m.enrollment.completedAt).length,
          certificates: mine.filter((m) => m.certificate).length,
          certifiedHours,
        },
        inProgress: inProgress.sort((a, b) => b.progress.percent - a.progress.percent),
        awaitingQuiz,
      };
    });
  },
};

/* ================================== RELATÓRIOS ================================== */

export const reportsApi = {
  /** GET /reports/progress */
  progress() {
    return request(() => {
      const s = requireSession("admin");
      const db = getDb();
      return db.enrollments
        .filter((e) => e.companyId === s.companyId)
        .map((e) => {
          const u = db.users.find((x) => x.id === e.userId);
          const c = db.courses.find((x) => x.id === e.courseId);
          if (!u || !c) return null;
          const scores = db.attempts.filter((a) => a.userId === u.id && a.courseId === c.id).map((a) => a.score);
          return {
            name: u.name,
            email: u.email,
            department: u.department,
            course: c.title,
            progress: progressOf(c, e).percent,
            status: e.completedAt ? "Concluído" : progressOf(c, e).percent > 0 ? "Em andamento" : "Não iniciado",
            bestScore: scores.length ? Math.max(...scores) : null,
            enrolledAt: e.enrolledAt,
            completedAt: e.completedAt,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  },

  /** GET /reports/whatsapp?days= */
  whatsapp(days: number) {
    return request(() => {
      const s = requireSession("admin");
      return getDb()
        .whatsapp.filter((d) => d.companyId === s.companyId)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-days);
    });
  },
};

/* ===================================== DEMO ===================================== */

export const demoApi = {
  /** Restaura os dados fictícios originais deste navegador */
  reset() {
    return request(() => {
      resetDb();
      return { ok: true };
    }, 400);
  },
};
