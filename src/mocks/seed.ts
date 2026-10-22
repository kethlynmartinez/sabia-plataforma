import type {
  Certificate,
  Company,
  Course,
  Database,
  Enrollment,
  Feedback,
  Lesson,
  Module,
  QuizAttempt,
  User,
  WhatsAppDay,
} from "@/types";
import { IMAGES } from "./images";
import { mockHash, mulberry32 } from "./hash";

/**
 * Dados de demonstração — todos fictícios.
 * Empresa: Vértice Logística (verde-petróleo + âmbar), propositalmente
 * diferente da identidade preta, cinza e amarela padrão da plataforma para evidenciar o white-label.
 * Datas são relativas a "agora" para a demo sempre parecer atual.
 */

export const DB_VERSION = 5;
export const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS = {
  admin: { email: "rh@vertice.demo", label: "Empresa (RH)" },
  aluno: { email: "lucas@vertice.demo", label: "Colaborador" },
} as const;

const DAY = 86_400_000;
const daysAgo = (d: number, hour = 10) => {
  const dt = new Date(Date.now() - d * DAY);
  dt.setHours(hour, (d * 7) % 60, 0, 0);
  return dt.toISOString();
};
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const COMPANY_ID = "c_vertice";

const company: Company = {
  id: COMPANY_ID,
  slug: "vertice",
  name: "Vértice Logística",
  segment: "Logística e transporte",
  size: "201 a 500",
  whatsapp: "(11) 90000-0000",
  createdAt: daysAgo(120),
  theme: {
    displayName: "Vértice Aprende",
    primary: "#0F766E",
    highlight: "#F59E0B",
    logoUrl: "./demo/vertice-logo.svg",
    loginImage: IMAGES.warehouse,
    loginTitle: "Aprender faz parte da rota.",
    loginSubtitle: "Treinamentos rápidos para quem move a Vértice, no computador ou direto no WhatsApp.",
  },
};

type SeedUser = Omit<User, "passwordHash" | "companyId" | "createdAt" | "whatsappOptIn" | "active"> & {
  active?: boolean;
  createdDaysAgo: number;
};

const people: SeedUser[] = [
  { id: "u_renata", role: "admin", name: "Renata Albuquerque", email: "rh@vertice.demo", phone: "(11) 90000-0101", department: "Recursos Humanos", position: "Coordenadora de T&D", createdDaysAgo: 120, lastAccessAt: hoursAgo(1) },
  { id: "u_lucas", role: "aluno", name: "Lucas Martins", email: "lucas@vertice.demo", phone: "(11) 90000-0102", department: "Armazém", position: "Operador de empilhadeira", createdDaysAgo: 95, lastAccessAt: hoursAgo(3), bio: "Operador há 4 anos no CD de Guarulhos. Quero chegar a líder de turno." },
  { id: "u_juliana", role: "aluno", name: "Juliana Rocha", email: "juliana@vertice.demo", phone: "(11) 90000-0103", department: "Atendimento", position: "Analista de atendimento", createdDaysAgo: 90, lastAccessAt: hoursAgo(26) },
  { id: "u_carlos", role: "aluno", name: "Carlos Eduardo Lima", email: "carlos@vertice.demo", phone: "(11) 90000-0104", department: "Frota", position: "Motorista carreteiro", createdDaysAgo: 88, lastAccessAt: hoursAgo(50) },
  { id: "u_beatriz", role: "aluno", name: "Beatriz Nunes", email: "beatriz@vertice.demo", phone: "(11) 90000-0105", department: "Armazém", position: "Supervisora de turno", createdDaysAgo: 80, lastAccessAt: hoursAgo(5) },
  { id: "u_rafael", role: "aluno", name: "Rafael Teixeira", email: "rafael@vertice.demo", phone: "(11) 90000-0106", department: "Expedição", position: "Conferente", createdDaysAgo: 70, lastAccessAt: hoursAgo(73) },
  { id: "u_patricia", role: "aluno", name: "Patrícia Gomes", email: "patricia@vertice.demo", phone: "(11) 90000-0107", department: "Atendimento", position: "Analista de SAC", createdDaysAgo: 64, lastAccessAt: hoursAgo(20) },
  { id: "u_thiago", role: "aluno", name: "Thiago Ribeiro", email: "thiago@vertice.demo", phone: "(11) 90000-0108", department: "Frota", position: "Motorista", createdDaysAgo: 40, lastAccessAt: hoursAgo(140) },
  { id: "u_amanda", role: "aluno", name: "Amanda Freitas", email: "amanda@vertice.demo", phone: "(11) 90000-0109", department: "Administrativo", position: "Assistente administrativa", createdDaysAgo: 12, lastAccessAt: undefined },
  { id: "u_diego", role: "aluno", name: "Diego Santana", email: "diego@vertice.demo", phone: "(11) 90000-0110", department: "Armazém", position: "Auxiliar de logística", createdDaysAgo: 60, lastAccessAt: hoursAgo(600), active: false },
  { id: "u_fernanda", role: "aluno", name: "Fernanda Costa", email: "fernanda@vertice.demo", phone: "(11) 90000-0111", department: "Expedição", position: "Líder de expedição", createdDaysAgo: 85, lastAccessAt: hoursAgo(9) },
];

const users: User[] = people.map(({ createdDaysAgo, active, ...p }) => ({
  ...p,
  companyId: COMPANY_ID,
  passwordHash: mockHash(DEMO_PASSWORD),
  active: active ?? true,
  whatsappOptIn: p.id !== "u_amanda",
  createdAt: daysAgo(createdDaysAgo),
}));

/* ----------------------------- Cursos ----------------------------- */

const video = (id: string, title: string, durationMin: number, content: string): Lesson => ({
  id,
  title,
  type: "video",
  durationMin,
  content,
});
const text = (id: string, title: string, durationMin: number, content: string): Lesson => ({
  id,
  title,
  type: "texto",
  durationMin,
  content,
});
const mod = (id: string, title: string, lessons: Lesson[]): Module => ({ id, title, lessons });

const courses: Course[] = [
  {
    id: "crs_empilhadeira",
    companyId: COMPANY_ID,
    title: "Segurança na Operação de Empilhadeiras",
    summary: "Checklist, estabilidade de carga e circulação segura no armazém.",
    description:
      "Curso obrigatório para operadores e líderes de armazém. Cobre a inspeção pré-operacional, os princípios de estabilidade da carga, as regras de circulação nos corredores e como agir em situações de risco.",
    category: "Segurança",
    coverUrl: IMAGES.forklift,
    status: "publicado",
    workloadHours: 6,
    createdAt: daysAgo(110),
    updatedAt: daysAgo(14),
    modules: [
      mod("m_emp_1", "Antes de ligar a máquina", [
        video("l_emp_1", "Boas-vindas e objetivos do curso", 6, "Neste vídeo a coordenação de segurança apresenta os objetivos do curso e os indicadores de acidentes do último ano no CD."),
        text("l_emp_2", "Checklist pré-operacional", 10, "A inspeção antes do turno leva menos de 5 minutos e evita a maior parte das falhas mecânicas.\n\n- Verifique nível de bateria ou combustível\n- Teste freios, buzina e luzes\n- Confira garfos, correntes e mastro\n- Observe vazamentos no piso\n\nEncontrou algo fora do padrão? Não opere: registre no app de manutenção e avise a liderança."),
      ]),
      mod("m_emp_2", "Operação segura", [
        video("l_emp_3", "Carga, centro de gravidade e estabilidade", 12, "Entenda o triângulo de estabilidade e por que a carga deve sempre trafegar baixa e inclinada para trás."),
        text("l_emp_4", "Circulação em corredores e rampas", 8, "Respeite a velocidade máxima de 8 km/h nas áreas internas.\n\n- Em rampas, a carga fica sempre voltada para o lado de cima\n- Buzine em cruzamentos e saídas de corredor\n- Pedestres têm prioridade nas faixas demarcadas"),
      ]),
      mod("m_emp_3", "Situações de risco", [
        text("l_emp_5", "O que fazer em caso de tombamento", 7, "Nunca tente pular da empilhadeira.\n\n- Segure firme o volante\n- Mantenha os pés dentro da cabine\n- Incline o corpo para o lado oposto à queda"),
        video("l_emp_6", "Estudo de caso: quase-acidentes no armazém", 9, "Análise de três quase-acidentes reais (com dados anonimizados) e das mudanças de processo que vieram depois deles."),
      ]),
    ],
    quiz: {
      enabled: true,
      passingScore: 70,
      maxAttempts: 3,
      questions: [
        { id: "q_emp_1", prompt: "Qual a primeira atitude ao identificar um vazamento no checklist?", options: ["Operar com cuidado até o fim do turno", "Não operar e registrar a manutenção", "Limpar o piso e seguir normalmente"], correctIndex: 1 },
        { id: "q_emp_2", prompt: "Como a carga deve trafegar?", options: ["Alta, para melhor visibilidade", "Baixa e inclinada para trás", "Na altura dos olhos do operador"], correctIndex: 1 },
        { id: "q_emp_3", prompt: "Qual a velocidade máxima nas áreas internas do CD?", options: ["8 km/h", "15 km/h", "20 km/h"], correctIndex: 0 },
        { id: "q_emp_4", prompt: "Em uma rampa com carga, os garfos ficam voltados para…", options: ["O lado de baixo da rampa", "O lado de cima da rampa", "Tanto faz"], correctIndex: 1 },
        { id: "q_emp_5", prompt: "Em caso de tombamento, o operador deve:", options: ["Pular da cabine imediatamente", "Segurar o volante e inclinar o corpo para o lado oposto", "Soltar o cinto para sair mais rápido"], correctIndex: 1 },
      ],
    },
  },
  {
    id: "crs_atendimento",
    companyId: COMPANY_ID,
    title: "Atendimento ao Cliente com Excelência",
    summary: "Escuta ativa e comunicação clara em atrasos, avarias e reclamações.",
    description:
      "Para equipes de SAC, comercial e expedição. Mostra como transformar contatos difíceis em oportunidades de fidelização, com roteiros prontos para as situações mais comuns de uma transportadora.",
    category: "Atendimento",
    coverUrl: IMAGES.support,
    status: "publicado",
    workloadHours: 4,
    createdAt: daysAgo(100),
    updatedAt: daysAgo(30),
    modules: [
      mod("m_at_1", "Fundamentos", [
        video("l_at_1", "O que o cliente espera de uma transportadora", 8, "Prazo, previsibilidade e transparência: os três pilares da percepção de qualidade em logística."),
        text("l_at_2", "Escuta ativa em 4 passos", 6, "- Deixe o cliente terminar de falar\n- Repita o problema com suas palavras\n- Diga o que vai fazer e quando\n- Retorne antes do prazo combinado"),
      ]),
      mod("m_at_2", "Situações difíceis", [
        text("l_at_3", "Atrasos e avarias: como comunicar", 7, "Avise antes que o cliente pergunte. Uma mensagem proativa reduz pela metade as reclamações formais.\n\nUse frases que mostram ação: \"já acionei\", \"vou te atualizar às 15h\"."),
        video("l_at_4", "Simulação: cliente insatisfeito", 10, "Role-play de uma ligação real (com atores) e comentários sobre cada decisão do atendente."),
      ]),
    ],
    quiz: {
      enabled: true,
      passingScore: 75,
      maxAttempts: 2,
      questions: [
        { id: "q_at_1", prompt: "Qual é o primeiro passo da escuta ativa?", options: ["Oferecer uma solução rapidamente", "Deixar o cliente terminar de falar", "Transferir para o supervisor"], correctIndex: 1 },
        { id: "q_at_2", prompt: "Diante de um atraso, o ideal é:", options: ["Esperar o cliente entrar em contato", "Avisar proativamente com uma previsão", "Só comunicar após a entrega"], correctIndex: 1 },
        { id: "q_at_3", prompt: "Qual frase transmite mais segurança?", options: ["\"Vou ver o que dá pra fazer\"", "\"Já acionei a equipe e te atualizo às 15h\"", "\"Isso não é com o meu setor\""], correctIndex: 1 },
        { id: "q_at_4", prompt: "Os três pilares da percepção de qualidade em logística são:", options: ["Preço, prazo e brindes", "Prazo, previsibilidade e transparência", "Volume, rota e frota"], correctIndex: 1 },
      ],
    },
  },
  {
    id: "crs_direcao",
    companyId: COMPANY_ID,
    title: "Direção Defensiva para Motoristas",
    summary: "Prevenção de acidentes, jornada de trabalho e gestão da fadiga.",
    description:
      "Reciclagem anual obrigatória para a frota própria e agregados. Inclui os cinco elementos da direção defensiva, regras de jornada e sinais de fadiga ao volante.",
    category: "Segurança",
    coverUrl: IMAGES.truck,
    status: "publicado",
    workloadHours: 8,
    createdAt: daysAgo(95),
    updatedAt: daysAgo(20),
    modules: [
      mod("m_dd_1", "Prevenção", [
        video("l_dd_1", "Os 5 elementos da direção defensiva", 14, "Conhecimento, atenção, previsão, decisão e habilidade, com exemplos de rodovia."),
        text("l_dd_2", "Distância de seguimento e frenagem", 9, "Use a regra dos 4 segundos para veículos pesados e aumente para 6 segundos com chuva.\n\n- Escolha um ponto fixo na pista\n- Conte o tempo entre o veículo da frente e o seu passarem por ele"),
      ]),
      mod("m_dd_2", "Jornada e saúde", [
        text("l_dd_3", "Jornada e descanso", 8, "Faça pausas de 30 minutos a cada 5h30 de direção contínua e registre todas no aplicativo de jornada."),
        video("l_dd_4", "Fadiga ao volante", 11, "Como reconhecer os primeiros sinais de sono e por que café não substitui o descanso."),
      ]),
    ],
    quiz: {
      enabled: true,
      passingScore: 70,
      maxAttempts: 3,
      questions: [
        { id: "q_dd_1", prompt: "Qual regra de distância é indicada para veículos pesados em pista seca?", options: ["2 segundos", "4 segundos", "10 segundos"], correctIndex: 1 },
        { id: "q_dd_2", prompt: "Com chuva, a distância de seguimento deve…", options: ["Diminuir", "Continuar igual", "Aumentar"], correctIndex: 2 },
        { id: "q_dd_3", prompt: "Qual destes NÃO é um dos 5 elementos da direção defensiva?", options: ["Previsão", "Velocidade", "Atenção"], correctIndex: 1 },
        { id: "q_dd_4", prompt: "Ao sentir os primeiros sinais de sono, o motorista deve:", options: ["Tomar café e seguir", "Abrir a janela e aumentar o rádio", "Parar em local seguro e descansar"], correctIndex: 2 },
      ],
    },
  },
  {
    id: "crs_lideranca",
    companyId: COMPANY_ID,
    title: "Liderança de Turno",
    summary: "Feedback, rotina de início de turno e gestão de pessoas na operação.",
    description:
      "Trilha para supervisores e líderes recém-promovidos. Ferramentas práticas para conduzir a equipe com clareza, dar feedback e manter a operação no ritmo.",
    category: "Gestão",
    coverUrl: IMAGES.leadership,
    status: "publicado",
    workloadHours: 5,
    createdAt: daysAgo(70),
    updatedAt: daysAgo(6),
    modules: [
      mod("m_ld_1", "O papel do líder", [
        text("l_ld_1", "Do operacional à liderança", 7, "Ser promovido muda o foco: do seu resultado para o resultado do time.\n\n- Delegue com contexto\n- Acompanhe sem microgerenciar\n- Reconheça em público, corrija em particular"),
        video("l_ld_2", "Feedback que funciona", 12, "O modelo Situação–Comportamento–Impacto aplicado a casos da operação."),
      ]),
      mod("m_ld_2", "Rotina do turno", [
        text("l_ld_3", "Reunião de início de turno em 10 minutos", 6, "Pauta fixa: segurança, metas do dia, pontos de atenção e reconhecimento. Em pé, no início do turno, sempre no mesmo horário."),
      ]),
    ],
    quiz: {
      enabled: true,
      passingScore: 70,
      maxAttempts: 2,
      questions: [
        { id: "q_ld_1", prompt: "Qual é a ordem do modelo de feedback apresentado?", options: ["Situação, Comportamento, Impacto", "Impacto, Solução, Prazo", "Crítica, Elogio, Crítica"], correctIndex: 0 },
        { id: "q_ld_2", prompt: "Correções devem ser feitas…", options: ["Em público, para servir de exemplo", "Em particular", "Por e-mail para toda a equipe"], correctIndex: 1 },
        { id: "q_ld_3", prompt: "A reunião de início de turno deve durar cerca de:", options: ["10 minutos", "45 minutos", "1 hora"], correctIndex: 0 },
      ],
    },
  },
  {
    id: "crs_lgpd",
    companyId: COMPANY_ID,
    title: "LGPD no Dia a Dia",
    summary: "Como tratar dados de clientes e colegas com segurança.",
    description: "Em construção: conceitos básicos da Lei Geral de Proteção de Dados aplicados à rotina da operação.",
    category: "Compliance",
    coverUrl: IMAGES.privacy,
    status: "rascunho",
    workloadHours: 2,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    modules: [
      mod("m_lg_1", "Conceitos", [
        text("l_lg_1", "O que é dado pessoal", 6, "Qualquer informação que identifique uma pessoa: nome, CPF, telefone, placa do veículo, endereço de entrega…"),
      ]),
    ],
    quiz: { enabled: false, passingScore: 70, maxAttempts: 2, questions: [] },
  },
];

/* --------------------- Matrículas, provas, certificados --------------------- */

type Outcome = "pass" | "fail" | "fail-then-pass" | null;
const plan: [userId: string, courseId: string, fraction: number, outcome: Outcome, finishedDaysAgo: number][] = [
  ["u_lucas", "crs_empilhadeira", 1, "pass", 18],
  ["u_lucas", "crs_atendimento", 0.5, null, 0],
  ["u_lucas", "crs_lideranca", 0, null, 0],
  ["u_juliana", "crs_atendimento", 1, "pass", 25],
  ["u_juliana", "crs_lideranca", 0.34, null, 0],
  ["u_carlos", "crs_direcao", 1, "fail-then-pass", 9],
  ["u_carlos", "crs_empilhadeira", 0.34, null, 0],
  ["u_beatriz", "crs_empilhadeira", 1, "pass", 33],
  ["u_beatriz", "crs_lideranca", 1, "fail", 2],
  ["u_rafael", "crs_empilhadeira", 0.67, null, 0],
  ["u_patricia", "crs_atendimento", 0.75, null, 0],
  ["u_thiago", "crs_direcao", 0.5, null, 0],
  ["u_amanda", "crs_atendimento", 0, null, 0],
  ["u_diego", "crs_empilhadeira", 0.17, null, 0],
  ["u_fernanda", "crs_lideranca", 1, "pass", 4],
  ["u_fernanda", "crs_empilhadeira", 1, "pass", 41],
  ["u_fernanda", "crs_atendimento", 0.25, null, 0],
];

const answersFor = (course: Course, wrong: number) =>
  course.quiz.questions.map((q, i) =>
    i < wrong ? (q.correctIndex + 1) % q.options.length : q.correctIndex,
  );

const scoreOf = (course: Course, answers: number[]) => {
  const qs = course.quiz.questions;
  const right = qs.filter((q, i) => answers[i] === q.correctIndex).length;
  return Math.round((right / qs.length) * 100);
};

const enrollments: Enrollment[] = [];
const attempts: QuizAttempt[] = [];
const certificates: Certificate[] = [];

plan.forEach(([userId, courseId, fraction, outcome, finished], idx) => {
  const course = courses.find((c) => c.id === courseId)!;
  const lessons = course.modules.flatMap((m) => m.lessons);
  const done = lessons.slice(0, Math.round(lessons.length * fraction));
  const enrolledAt = daysAgo(finished + 20 + (idx % 5) * 3);
  const enrollment: Enrollment = {
    id: `e_${idx + 1}`,
    companyId: COMPANY_ID,
    userId,
    courseId,
    completedLessonIds: done.map((l) => l.id),
    lastLessonId: done.at(-1)?.id,
    enrolledAt,
  };

  const addAttempt = (wrong: number, when: string) => {
    const answers = answersFor(course, wrong);
    const score = scoreOf(course, answers);
    const attempt: QuizAttempt = {
      id: `a_${attempts.length + 1}`,
      companyId: COMPANY_ID,
      userId,
      courseId,
      answers,
      score,
      passed: score >= course.quiz.passingScore,
      createdAt: when,
    };
    attempts.push(attempt);
    return attempt;
  };

  if (outcome === "fail") addAttempt(2, daysAgo(finished));
  if (outcome === "fail-then-pass") addAttempt(2, daysAgo(finished + 2));
  if (outcome === "pass" || outcome === "fail-then-pass") {
    addAttempt(idx % 3 === 0 ? 1 : 0, daysAgo(finished, 15));
    enrollment.completedAt = daysAgo(finished, 15);
    certificates.push({
      id: `cert_${certificates.length + 1}`,
      companyId: COMPANY_ID,
      userId,
      courseId,
      code: `VRT-${(4821 + idx * 137).toString(36).toUpperCase()}-${courseId.slice(4, 7).toUpperCase()}`,
      issuedAt: enrollment.completedAt,
    });
  }
  enrollments.push(enrollment);
});

const feedbacks: Feedback[] = [
  { id: "f_1", companyId: COMPANY_ID, kind: "empresa_para_aluno", authorId: "u_renata", userId: "u_lucas", courseId: "crs_empilhadeira", message: "Parabéns pela aprovação, Lucas! Seu checklist virou referência no turno da manhã.", createdAt: daysAgo(17) },
  { id: "f_2", companyId: COMPANY_ID, kind: "empresa_para_aluno", authorId: "u_renata", userId: "u_lucas", message: "Te matriculamos em Liderança de Turno. É o próximo passo para a vaga de líder. Conte com a gente!", createdAt: daysAgo(3) },
  { id: "f_3", companyId: COMPANY_ID, kind: "empresa_para_aluno", authorId: "u_renata", userId: "u_carlos", courseId: "crs_direcao", message: "Ótima evolução da 1ª para a 2ª tentativa. Obrigada pelo empenho!", createdAt: daysAgo(8) },
  { id: "f_4", companyId: COMPANY_ID, kind: "aluno_para_curso", authorId: "u_lucas", userId: "u_lucas", courseId: "crs_empilhadeira", rating: 5, message: "Os estudos de caso ajudaram muito. Poderia ter mais vídeos curtos assim.", createdAt: daysAgo(18) },
  { id: "f_5", companyId: COMPANY_ID, kind: "aluno_para_curso", authorId: "u_juliana", userId: "u_juliana", courseId: "crs_atendimento", rating: 4, message: "Roteiros práticos, já usei na mesma semana. Sugiro um módulo sobre WhatsApp com cliente.", createdAt: daysAgo(24) },
  { id: "f_6", companyId: COMPANY_ID, kind: "aluno_para_curso", authorId: "u_carlos", userId: "u_carlos", courseId: "crs_direcao", rating: 5, message: "Consegui fazer tudo no celular entre uma entrega e outra.", createdAt: daysAgo(9) },
  { id: "f_7", companyId: COMPANY_ID, kind: "aluno_para_curso", authorId: "u_fernanda", userId: "u_fernanda", courseId: "crs_lideranca", rating: 4, message: "A pauta da reunião de turno já está colada no quadro da expedição.", createdAt: daysAgo(4) },
  { id: "f_8", companyId: COMPANY_ID, kind: "aluno_para_curso", authorId: "u_beatriz", userId: "u_beatriz", courseId: "crs_empilhadeira", rating: 5, message: "Curso objetivo e bem produzido.", createdAt: daysAgo(32) },
];

/* ------------------------ Métricas de WhatsApp ------------------------ */

const whatsappHistory = (): WhatsAppDay[] => {
  const rand = mulberry32(42);
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date(Date.now() - (89 - i) * DAY);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const trend = 1 + i / 180; // engajamento crescente ao longo do trimestre
    const sent = Math.round((weekend ? 14 + rand() * 12 : 46 + rand() * 38) * trend);
    const read = Math.round(sent * (0.72 + rand() * 0.18));
    const replied = Math.round(read * (0.22 + rand() * 0.14));
    return { companyId: COMPANY_ID, date: d.toISOString().slice(0, 10), sent, read, replied };
  });
};

export const createSeed = (): Database => ({
  version: DB_VERSION,
  companies: [structuredClone(company)],
  users: structuredClone(users),
  courses: structuredClone(courses),
  enrollments: structuredClone(enrollments),
  attempts: structuredClone(attempts),
  certificates: structuredClone(certificates),
  feedbacks: structuredClone(feedbacks),
  whatsapp: whatsappHistory(),
});
