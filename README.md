# 📝 ProjetoInit – To‑Do List (Backend + Frontend)

![DER do projeto](images/image.png)

Projeto de estudo: backend em Node.js (Fastify, Prisma, JWT) e frontend em React + Vite + TypeScript. Inclui criação e exclusão de tarefas com autenticação via JWT e modal para criar tarefas.


## ‼️ATENÇÃO

- Para login no backend enquanto eu não criei a pagina de registrar use como login
 
- **email** - desenvolvedor@dev.com.
- **password** - 123456.
- Esse perfil é de membro e não tem tasks ativas para você testar e ver como o sistema esta funcionando.
- ps **( as descrições das tasks ainda são meramente ilustrativas)**

---

## 📖 Visão Geral

Arquitetura com separação por camadas (controllers, use-cases, repositories, middlewares). Backend com Prisma para persistência (SQLite por padrão) e repositórios em memória para testes. Frontend em React com Vite e componentes reutilizáveis.

---

## ⚡ Tecnologias

- Backend: Node.js, Fastify, Prisma, Zod, TypeScript, JWT
- Frontend: React, Vite, TypeScript, Tailwind / CSS custom
- Testes: Vitest

---


## 📂 Estrutura (resumida)

- backend/
  - src/ (controllers, routes, use-cases, repositories, middlewares)
  - app.ts (Fastify + CORS + plugins)
- frontend/
  - src/ (components, pages, api, hooks, context)
  - vite.config.ts

---

## 🔧 Instalação (Windows)

1. Clonar repositório (raiz do projeto)
   - git clone <repo> && cd ProjetoInit

2. Backend
   - cd backend
   - npm install
   - npx prisma generate
   - copiar/ajustar .env a partir de .env.example (defina JWT_SECRET)
   - npm run dev
   - backend roda em: http://localhost:3333

3. Frontend
   - cd frontend
   - npm install
   - (opcional) configurar .env VITE_API_URL se backend estiver em outra URL
   - npm run dev
   - frontend roda em: http://localhost:5173

Comandos rápidos:
- cd c:\Users\rafael.moraes\Desktop\JS\ProjetoInit\backend
- npm install
- npx prisma generate
- npm run dev

- cd c:\Users\rafael.moraes\Desktop\JS\ProjetoInit\frontend
- npm install
- npm run dev

---

## 🔑 Variáveis de ambiente importantes

-/.env
  - JWT_SECRET=seu_seguro_secret
- frontend (opcional)
  - VITE_API_URL=http://localhost:3333

---

## 🔗 Como o Frontend integra com o Backend

- Autenticação:
  - Após login (POST /sessions) o backend retorna JWT.
  - Frontend armazena token em localStorage (procurado em chaves comuns: `token`, `@app:token`, `@ignite:token`, `access_token`) — ajuste se preferir outra chave.
  - Todas requisições autenticadas enviam header:
    Authorization: Bearer <token>

- Endpoints usados pelo frontend:
  - GET  /todo            → listar tarefas
  - POST /todo            → criar (body: { title: "..." })
  - DELETE /todo/:id      → deletar (envia JWT no header)
  - PATCH /todo/:id/complete → marcar concluída

- Observações de implementação:
  - A exclusão é feita com optimstic update: a task é removida imediatamente da UI e depois a API é chamada; em caso de erro é feito refetch.
  - O formulário de criação abre em modal com backdrop desfocado; botão “Criar primeira tarefa” chama o mesmo modal.
  - Para evitar CORS em dev você pode usar proxy no vite.config.ts apontando `/todo` → `http://localhost:3333`.

---

## 📡 Endpoints principais (backend)

Usuário:
- POST /users — criar usuário
- POST /sessions — login (retorna JWT)

Todos:
- GET /todo — listar todos (requer JWT)
- POST /todo — criar todo (requer JWT) — Body: { "title": "texto" }
- DELETE /todo/:id — deletar todo (requer JWT)

---

## 🛠 Notas importantes / Troubleshooting

1. CORS / preflight (OPTIONS)
   - Navegador executa preflight antes de DELETE; backend deve permitir:
     - Access-Control-Allow-Methods incluindo DELETE
     - Access-Control-Allow-Headers incluindo Authorization
   - No Fastify registre @fastify/cors com allowedHeaders e methods apropriados (o projeto já inclui exemplo).

2. Token ausente / 401
   - Verifique localStorage no DevTools e confirme a chave com o JWT.
   - No Network → Request Headers veja se `Authorization` está presente.

3. 404 ao criar/deletar
   - Confirme URL correta: http://localhost:3333/todo
   - Confirme rota correspondente no backend (controllers/todo).

4. HMR / import errors
   - Se aparecer "does not provide an export named 'X'", ajuste import/export (default vs named) e reinicie o dev server.

5. Proxy Vite (alternativa ao CORS)
   - Em frontend/vite.config.ts adicione:
    server.proxy = { '/todo': 'http://localhost:3333', '/auth': 'http://localhost:3333' }

---

## 🧪 Testes

- Backend: cd backend && npm run test (Vitest)
- Frontend: adicionar testes conforme necessidade

---

## ✅ O que foi implementado 

- Backend:
  - Fastify + Prisma + JWT
  - Endpoints CRUD para tarefas e autenticação
  - Middleware verify-jwt

- Frontend:
  - React + Vite + TypeScript
  - Modal para criar tarefas com backdrop desfocado
  - Grid responsivo de tasks (itens lado a lado)
  - Criação de tarefa via POST /todo (title obrigatório)
  - Exclusão otimista via DELETE /todo/:id com JWT
  - UI updates imediatos e refetch em caso de erro


## 🛠 Próximos Passos

- ✅ Aumentar cobertura de testes nos **use-cases**.  
- ✅ Implementar update de todos.  
- ✅ Implementar update de status de todos.
- ✅ Implementar pagina principal.
- ✅ Implementar pagina e dashboard de adm.

---

✍️ Projeto em constante evolução – feito para estudos e aprendizado!