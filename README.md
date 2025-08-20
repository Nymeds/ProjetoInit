# ProjetoInit

📌 Projeto Backend – To-Do List

Este é o backend de uma aplicação To-Do List desenvolvido em Node.js, utilizando Fastify, Prisma e JWT para autenticação.

Ele oferece endpoints para cadastro, autenticação de usuários e gerenciamento de tarefas.

🚀 Tecnologias utilizadas

Node.js
 – Ambiente de execução JavaScript.

Fastify
 – Framework web rápido e minimalista.

Prisma ORM
 – ORM para banco de dados.

JWT (JSON Web Token)
 – Autenticação segura baseada em tokens.

Zod
 – Validação de dados.

TypeScript
 – Superset do JavaScript com tipagem estática.

📂 Estrutura de pastas
backend/
│── prisma/              # Configurações e migrations do Prisma
│   └── schema.prisma
│
│── src/
│   ├── controllers/     # Lógica de entrada das rotas (Register, Login, Todo)
│   ├── middlewares/     # Middlewares (ex: verifyJwt)
│   ├── repositories/    # Implementação de acesso ao banco
│   ├── use-cases/       # Regras de negócio (RegisterUser, Authenticate, etc.)
│   ├── routes.ts        # Definição das rotas
│   └── server.ts        # Ponto de entrada do backend
│
│── package.json
│── tsconfig.json
│── README.md

⚙️ Como rodar o projeto
1. Clone o repositório
git clone https://github.com/seu-usuario/seu-repo.git
cd backend

2. Instale as dependências
npm install

3. Configure o banco de dados

No arquivo .env, adicione sua URL de conexão com o banco, por exemplo:

DATABASE_URL="postgresql://user:password@localhost:5432/todolist"

4. Rode as migrations
npx prisma migrate dev

5. Inicie o servidor em modo desenvolvimento
npm run dev


O backend estará rodando em:
👉 http://localhost:3333

🔑 Autenticação

O backend utiliza JWT para autenticação.

Após realizar login (POST /sessions), o cliente deve usar o token recebido no header Authorization para acessar rotas protegidas.

Exemplo:

Authorization: Bearer seu_token_aqui

📌 Endpoints principais
👤 Usuário

POST /users → Registrar novo usuário

POST /sessions → Login e geração de token JWT

✅ Todos

GET /todo → Listar todos os todos (requer token)

POST /todo → Criar novo todo (requer token)

PATCH /todo/:id/complete → Marcar como concluído (requer token)

DELETE /todo/:id → Excluir todo (requer token)

🛠 Próximos passos

 Adicionar testes unitários para cada use case.

 Implementar refresh token.

 Adicionar tratamento de erros mais detalhado.

 Configurar Docker para rodar banco e API.