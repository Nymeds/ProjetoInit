# 📝 ProjetoInit – Backend To-Do List



![DER do projeto](images/image.png)




📌 **Projeto Backend – To-Do List**

Este é o backend de uma aplicação **To-Do List** desenvolvido em **Node.js**, utilizando **Fastify**, **Prisma** e **JWT** para autenticação, além de **Vitest** para testes.

Cada **task** é vinculada a um **usuário**.  
A aplicação possui tanto integração com banco real (**SQLite via Prisma**) quanto um banco **em memória** para testes, o que significa que **dados de teste não são persistidos** no banco real.

O projeto também utiliza **Zod** para validação de dados.  
⚠️ Em caso de alterações, é importante observar os **schemas** de validação.

Este projeto está em constante evolução, pois é um objeto de estudo 🚀.

---

## 📖 Visão Geral

A arquitetura deste backend segue os princípios da **Clean Architecture**, com influências de **DDD (Domain-Driven Design)** e **Repository Pattern**.  

### Estrutura por camadas:
- **Use Cases** (`src/use-cases/`): Regras de negócio da aplicação.  
- **Repositórios** (`src/repositories/`): Interfaces e implementações de acesso a dados (Prisma e memória).  
- **Controllers** (`src/controllers/`): Entrada das requisições HTTP, orquestrando os casos de uso.  
- **Middlewares** (`src/middlewares/`): Funções intermediárias, como autenticação JWT.  
- **Infraestrutura** (`src/repositories/prisma/`): Implementações específicas do banco de dados.  
- **Validação e Tipagem**: Feitas com **Zod** e **TypeScript**.

Essa separação facilita **testes, manutenção e evolução** do sistema.

---

## ⚡ Tecnologias Utilizadas

- **Node.js** – Ambiente de execução JavaScript.  
- **Fastify** – Framework web rápido e minimalista.  
- **Prisma ORM** – ORM para banco de dados.  
- **JWT (JSON Web Token)** – Autenticação baseada em tokens.  
- **Zod** – Validação de dados.  
- **TypeScript** – Superset do JavaScript com tipagem estática.  
- **Vitest** – Testes unitários e de integração.  

---

## 📂 Estrutura de Pastas

```
backend/
│── prisma/              # Configurações e migrations do Prisma
│   └── schema.prisma
│
│── src/
│   ├── controllers/     # Lógica de entrada das rotas (Register, Login, Todo)
│   ├── middlewares/     # Middlewares (ex: verifyJwt)
│   ├── repositories/    # Interfaces e implementações (Prisma, memória)
│   ├── use-cases/       # Regras de negócio (RegisterUser, Authenticate, etc.)
│   ├── routes.ts        # Definição das rotas
│   └── server.ts        # Ponto de entrada do backend
│
│── package.json
│── tsconfig.json
│── README.md
```

---

## ⚙️ Como Rodar o Projeto

1. **Clone o repositório e entre na pasta backend**
   
   cd backend


2. **Instale as dependências**
   
   npm i
   

3. **Configure o banco de dados**
   
   npx prisma generate
   

4. **Inicie o servidor em modo desenvolvimento**
   
   npm run dev


5. **Rodando testes**
   
   npm run test
   

👉 Sugestões:
- `npm run test:ui` → abre a interface visual do Vitest.  
- `npx prisma studio` → abre o Prisma Studio para visualizar os dados.  

---

## 🌐 Servidor

O backend roda em:
```
http://localhost:3333
```

---

## 🔑 Autenticação

A autenticação é feita com **JWT**.  

- Após o login (`POST /sessions`), o token recebido deve ser enviado no **header**:
  ```
  Authorization: Bearer <token>
  ```

---

## 📌 Endpoints Principais

### 👤 Usuário
- `POST /users` → Registrar novo usuário.  
- `POST /sessions` → Login e geração de token JWT.  

### ✅ Todos
- `GET /todo` → Listar todos os *todos* (requer token).  
- `POST /todo` → Criar novo *todo* (requer token).  
- `PATCH /todo/:id/complete` → Marcar como concluído (requer token).  
- `DELETE /todo/:id` → Excluir *todo* (requer token).  

---

## 🛠 Próximos Passos

- ✅ Aumentar cobertura de testes nos **use-cases**.  
- ✅ Implementar um **Front-End**.  


---

✍️ Projeto em constante evolução – feito para estudos e aprendizado!