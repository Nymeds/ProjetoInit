# ProjetoInit — To-Do App (Backend + Frontend + Mobile)

![Descrição da imagem](./images/image.png)

**Projeto de estudo**: backend em Node.js (Fastify, Prisma, Zod, JWT) + frontend em React + Vite + TypeScript (também app mobile com React Native / Expo).
Funcionalidades principais: autenticação JWT, CRUD de tarefas, grupos (tarefas compartilhadas entre membros), dashboard de estatísticas.

---

## 🔎 Visão geral rápida

* **Backend**: Node.js, Fastify, Prisma (SQLite por padrão), Zod, JWT, TypeScript
* **Frontend**: React + Vite + TypeScript (components reutilizáveis)
* **Mobile**: Expo / React Native (integra com o backend)
* **Arquitetura**: controllers → use-cases → repositories → middlewares (limpa separação por responsabilidades)

---

## ✅ Principais features

* Registro e login (JWT).
* Criação/remoção/atualização de tarefas.
* Grupos: criar grupo, adicionar membros por e-mail.
* Tarefas podem pertencer a usuário ou a grupo; visíveis a membros do grupo.
* Dashboard com estatísticas (totais, concluídas, pendentes).
* Frontend com experiência mobile-first; inputs reutilizáveis, modal de criação.

---

## ⚠️ Conta de teste

* **E-mail**: `desenvolvedor@dev.com`
* **Senha**: `123456`
  (Conta de membro — útil para testes sem criar novo usuário.)

---

## 🔧 Pré-requisitos

* Node.js (>=16 recomendado)
* npm ou pnpm
* Git
* Para mobile: Expo CLI (se usar app React Native / Expo)
* Para persistência local: SQLite (não precisa instalar — Prisma cria `dev.db` automaticamente)

---

## 📁 Estrutura (resumida)

```
backend/
  src/
    controllers/
    routes/
    use-cases/
    repositories/
    middlewares/
  prisma/
  package.json

frontend/
  src/
    components/
    pages/
    hooks/
    services/
  vite.config.ts

todo/ (mobile - Expo)
  src/
  app.json / app.config
```

---

## 🛠 Instalação & execução

### 1) Clonar

```bash
git clone <repo-url> ProjetoInit
cd ProjetoInit
```

### 2) Backend

```bash
cd backend
npm install

# gerar client Prisma (obrigatório)
npx prisma generate

# criar/migrar banco (gera dev.db)
npx prisma migrate dev --name init

# rodar dev server
npm run dev
```

Servidor backend: `http://localhost:3333`

### 3) Frontend (web)

```bash
cd frontend
npm install


npm run dev
```

Frontend web: `http://localhost:5173`

### 4) Mobile (Expo)

```bash
cd todo
npm install
npx expo start
```

* Android emulator: use `http://10.0.2.2:3333`
* Expo em dispositivo físico: use IP LAN da máquina

---

## 🔐 Variáveis de ambiente

**Backend** (`backend/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="uma_senha_forte_aqui"
PORT=3333
```

**Frontend (Vite)** (`frontend/.env`)

```env
VITE_API_URL="http://localhost:3333"
```

**Mobile (Expo)** — use IP do host ou `10.0.2.2` para Android emulator.

---

## 📡 Endpoints principais

**Auth**

* `POST /users` → criar usuário
* `POST /sessions` → login → retorna `{ token, refreshToken }`
* `GET /sessions/me` → dados do usuário (JWT necessário)

**Groups**

* `POST /groups` → criar grupo + membros
* `GET /groups` → listar grupos do usuário

**Todos**

* `GET /todo` → listar tarefas visíveis (usuário + grupos)
* `POST /todo` → criar tarefa `{ title, description?, groupId? }`
* `DELETE /todo/:id` → deletar
* `PATCH /todo/:id/complete` → marcar concluída

> Autenticação: `Authorization: Bearer <token>` em requests protegidos.

---



---

## 🐞 Troubleshooting (erros comuns)

* 401 / token ausente → verificar localStorage / AsyncStorage
* dev.db não gerado → rodar `npx prisma generate` e `npx prisma migrate dev`
* Mobile não conecta → checar `baseURL` (`10.0.2.2` ou IP LAN)
* CORS → backend já configurado para dev; usar proxy Vite se necessário

---

## ✨ Próximos passos

* Testes automatizados para use-cases
* UI/UX mais responsiva
* Admin dashboard
* Exclusão/listagem de grupos e membros
* Atualizações de informação de tarefas
* Melhoria de estrutura do código 
* Tema escuro e claro ( web )


---

## 📝 Dicas rápidas

* Sempre rode `npx prisma generate` depois de alterar `schema.prisma`.
* Debug rápido: Postman/Insomnia contra backend → depois mobile/web.
* Mensagens de erro do backend podem vir como array JSON → frontend já possui helpers para mostrar legíveis.

---

## ✅ O que já foi implementado

**Backend**

* Fastify + Prisma + JWT
* CRUD tarefas
* Criação usuários
* Criação grupos + membros via e-mail
* Tarefas compartilhadas

**Frontend**

* React + Vite + TypeScript
* Modal de criação de tarefas
* Lista responsiva de tarefas
* Otimistic updates com refetch
* Exibição de tarefas compartilhadas

**Mobile**

* Expo / React Native
* Integração com backend (mesmos endpoints)

---

✍️ Projeto em constante evolução – feito para estudos e aprendizado!
