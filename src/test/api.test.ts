import { beforeEach, describe, expect, it } from "vitest";
import { authApi, coursesApi, learningApi, usersApi } from "@/services/api";
import { resetDb } from "@/mocks/db";
import { DEMO_PASSWORD } from "@/mocks/seed";

/** Fluxo ponta a ponta no back-end simulado: RH cadastra → colaborador conclui → certificado. */
describe("back-end simulado", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDb();
  });

  it("recusa senha incorreta", async () => {
    await expect(authApi.login("rh@vertice.demo", "errada123")).rejects.toThrow("E-mail ou senha incorretos");
  });

  it("isola o portal de cada empresa", async () => {
    await expect(authApi.login("lucas@vertice.demo", DEMO_PASSWORD, "outra-empresa")).rejects.toThrow();
  });

  it("bloqueia rotas de administrador para colaboradores", async () => {
    await authApi.login("lucas@vertice.demo", DEMO_PASSWORD);
    await expect(usersApi.list()).rejects.toMatchObject({ status: 403 });
  });

  it("emite certificado após aulas + aprovação na prova", async () => {
    // RH cadastra uma colaboradora já matriculada
    await authApi.login("rh@vertice.demo", DEMO_PASSWORD);
    const { user, tempPassword } = await usersApi.create({
      name: "Teste da Silva",
      email: "teste@vertice.demo",
      phone: "(11) 98888-7777",
      department: "Armazém",
      position: "Operadora",
      courseIds: ["crs_lideranca"],
    });
    const course = await coursesApi.get("crs_lideranca");
    authApi.logout();

    // colaboradora entra com a senha provisória
    await authApi.login(user.email, tempPassword, "vertice");
    for (const lesson of course.modules.flatMap((m) => m.lessons)) {
      await learningApi.completeLesson(course.id, lesson.id);
    }

    const wrong = course.quiz.questions.map((q) => (q.correctIndex + 1) % q.options.length);
    const fail = await learningApi.submitQuiz(course.id, wrong);
    expect(fail.attempt.passed).toBe(false);
    expect(fail.certificate).toBeUndefined();

    const right = course.quiz.questions.map((q) => q.correctIndex);
    const pass = await learningApi.submitQuiz(course.id, right);
    expect(pass.attempt.score).toBe(100);
    expect(pass.certificate).toBeDefined();

    const mine = await learningApi.myCourse(course.id);
    expect(mine.enrollment.completedAt).toBeDefined();
  }, 20_000);
});
