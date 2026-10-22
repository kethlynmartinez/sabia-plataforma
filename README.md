# Sabiá · Plataforma de aprendizagem corporativa

[![Deploy no GitHub Pages](https://github.com/kethlynmartinez/sabia-plataforma/actions/workflows/deploy.yml/badge.svg)](https://github.com/kethlynmartinez/sabia-plataforma/actions/workflows/deploy.yml)

> **Versão de portfólio.** Todos os dados são fictícios e o back-end é simulado no navegador.
> **Sobre o nome:** Sabiá vem da busca por um nome brasileiro, que fizesse referência a saber e aprender. A identidade visual se inspira no sabiá-una: preto, tons de cinza e o amarelo do bico, com um selo do pássaro para cada momento do site (logo, dúvidas, anúncios, aprovação e erro).

> Sabiá é uma marca fictícia. Nenhum dado real de empresa, cliente ou colaborador está neste repositório.

**Demo:** https://kethlynmartinez.github.io/sabia-plataforma/ · contas de demonstração na tela de login (um clique).

Sabiá é um LMS corporativo white-label: a empresa cliente cadastra a equipe, publica cursos com avaliações
e certificados, e aplica **a própria identidade visual** (logo, cores, imagens e textos). Os colaboradores acessam por um portal
exclusivo da empresa e recebem convites e lembretes **pelo WhatsApp**.

---

## O case

Projeto baseado em um produto que desenvolvi durante meu estágio em uma edtech, do conceito à interface:

1. **Ideação e UX:** levantei as ideias iniciais do produto e os fluxos de empresa e colaborador.
2. **Wireframes no Figma:** um colega estruturou as telas fixas; eu refinei a direção visual com texturas, paleta, fotografia e
   componentes.
3. **Prototipação com Lovable:** as telas refinadas viraram a primeira versão navegável em React.
4. **Engenharia de front-end:** refatorei o código gerado, corrigi bugs e integrei com a API do time de back-end. O produto teve três
   iterações com mudanças de arquitetura (ex.: o cadastro público de alunos foi removido e passou a ser feito pela empresa).
5. **Esta versão:** reescrita para portfólio, consolidando as ideias das três versões e completando o que faltava. Nome, marca e
   dados da empresa original foram substituídos por uma marca fictícia, e a API real virou um back-end simulado.

## O que a demo mostra

| Área | Funcionalidades |
| --- | --- |
| **Landing** | Proposta de valor, como funciona, recursos, simulador interativo de white-label e FAQ |
| **Cadastro da empresa** | Onboarding em 2 etapas → painel com checklist de primeiros passos |
| **Login** | Login único com redirecionamento por perfil, acesso demo com um clique, recuperação de senha |
| **Portal da empresa** `#/e/vertice` | Tela de login com a marca da empresa (cores, logo, imagem e textos personalizados) |
| **Painel da empresa** | Dashboard (engajamento no WhatsApp, conclusão por curso, atividade), colaboradores (cadastro, matrícula, feedback, senha provisória, desativação, CSV), editor de cursos (módulos, aulas em vídeo/texto, prova, matrículas, lembretes), avaliações (notas, aprovação, opiniões), relatórios em CSV, personalização com pré-visualização ao vivo e configurações |
| **Área do colaborador** | Dashboard, meus cursos, player de aulas que retoma de onde parou, prova com nota mínima e tentativas, certificado para impressão/PDF, avaliação do curso, recados do RH e perfil |

A empresa fictícia **Vértice Logística** usa verde-petróleo e âmbar, de propósito bem diferente do preto, cinza e amarelo padrão da plataforma,
para evidenciar o white-label.

### Contas de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Empresa (RH) | `rh@vertice.demo` | `demo1234` |
| Colaborador | `lucas@vertice.demo` | `demo1234` |

Os dados ficam no `localStorage` de quem visita. O botão **“Restaurar dados da demo”** (rodapé e menu do usuário) volta ao estado original.

## Stack e decisões técnicas

- **React 18 + TypeScript + Vite**, **Tailwind CSS** e componentes Radix/shadcn (apenas os usados).
- **TanStack Query** para dados assíncronos: cache, invalidação após mutações e estados de carregamento e erro.
- **Back-end simulado** (`src/services/api.ts` + `src/mocks/`): cada função corresponde a um endpoint REST e aplica as regras
  do servidor, como autenticação por sessão, isolamento por empresa (multi-tenant), papéis (admin × colaborador), validações e
  transações com rollback. Para usar uma API real, basta trocar a implementação dessas funções.
- **Tema dinâmico:** a empresa escolhe 2 cores e `src/lib/theme.ts` deriva a paleta (hover, tons suaves, texto com contraste
  WCAG) em CSS custom properties. Pré-visualizações usam o tema com escopo local, sem afetar a página.
- **HashRouter + `base: "./"`:** funciona no GitHub Pages em qualquer subpasta, sem configurar o servidor.
- **Code splitting por rota**, imagens com fallback, upload com compressão no navegador e CSV compatível com o Excel em português.
- **Acessibilidade:** labels associados, estados `aria-*`, foco visível, `prefers-reduced-motion` e alerta de contraste na
  personalização.
- **Testes (Vitest):** utilitários de tema e formulário, além do fluxo de ponta a ponta no back simulado (RH cadastra →
  colaborador estuda → reprova → é aprovado → recebe o certificado).

```
src/
├── components/        # layout (AppShell, AuthLayout), editor de curso, player, landing, kit de UI
├── contexts/          # sessão (AuthProvider)
├── hooks/             # useAuth, useDocumentTheme, usePageTitle
├── lib/               # tema, validação, formatação, arquivos/CSV
├── mocks/             # seed fictício, "banco" em localStorage, imagens
├── pages/             # Landing, auth/, empresa/, aluno/
├── services/api.ts    # camada de API (back-end simulado)
└── types/             # modelo de domínio
```

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:8080
npm test           # testes
npm run build      # gera dist/
```

## Privacidade

- Nenhum nome, endereço, contato, URL de API, credencial ou dado de cliente da empresa original foi mantido.
- Pessoas, empresa e depoimentos são fictícios. As fotos vêm de banco de imagens (Unsplash).
- A marca Sabiá, a empresa Vértice Logística e seus colaboradores são inventados para a demonstração.

---

Interface, UX e front-end: **Kethlyn Martinez** · [GitHub](https://github.com/kethlynmartinez)
