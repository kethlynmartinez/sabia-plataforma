/* ============================================================
 * Modelo de domínio do LMS
 * Empresa (tenant) → colaboradores, cursos, matrículas,
 * avaliações, certificados e feedbacks.
 * ============================================================ */

export type Role = "admin" | "aluno";

export interface CompanyTheme {
  /** Nome exibido para os colaboradores (ex.: "Vértice Aprende") */
  displayName: string;
  primary: string;
  highlight: string;
  logoUrl?: string;
  loginImage?: string;
  loginTitle: string;
  loginSubtitle: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  segment: string;
  size: string;
  whatsapp: string;
  theme: CompanyTheme;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  department: string;
  position: string;
  active: boolean;
  bio?: string;
  whatsappOptIn: boolean;
  createdAt: string;
  lastAccessAt?: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export type LessonType = "video" | "texto";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  videoUrl?: string;
  /** Texto da aula (parágrafos separados por linha em branco, "- " para lista) */
  content: string;
  durationMin: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  enabled: boolean;
  /** Nota mínima para aprovação (0–100) */
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

export type CourseStatus = "rascunho" | "publicado" | "arquivado";

export interface Course {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  coverUrl: string;
  status: CourseStatus;
  workloadHours: number;
  modules: Module[];
  quiz: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  companyId: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  lastLessonId?: string;
  enrolledAt: string;
  completedAt?: string;
}

export interface QuizAttempt {
  id: string;
  companyId: string;
  userId: string;
  courseId: string;
  answers: number[];
  score: number;
  passed: boolean;
  createdAt: string;
}

export interface Certificate {
  id: string;
  companyId: string;
  userId: string;
  courseId: string;
  code: string;
  issuedAt: string;
}

export type FeedbackKind = "empresa_para_aluno" | "aluno_para_curso";

export interface Feedback {
  id: string;
  companyId: string;
  kind: FeedbackKind;
  authorId: string;
  /** Colaborador envolvido (destinatário ou autor, conforme o tipo) */
  userId: string;
  courseId?: string;
  rating?: number;
  message: string;
  createdAt: string;
}

export interface WhatsAppDay {
  companyId: string;
  date: string; // YYYY-MM-DD
  sent: number;
  read: number;
  replied: number;
}

export interface Database {
  version: number;
  companies: Company[];
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  attempts: QuizAttempt[];
  certificates: Certificate[];
  feedbacks: Feedback[];
  whatsapp: WhatsAppDay[];
}

export interface Session {
  token: string;
  userId: string;
  companyId: string;
  role: Role;
  expiresAt: number;
}

/* ---------- Tipos de leitura (como um back-end devolveria) ---------- */

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export interface MyCourse {
  course: Course;
  enrollment: Enrollment;
  progress: CourseProgress;
  attempts: QuizAttempt[];
  bestScore: number | null;
  passed: boolean;
  certificate?: Certificate;
}

export interface CourseSummary extends Course {
  enrolledCount: number;
  completedCount: number;
  lessonsCount: number;
  avgRating: number | null;
}
