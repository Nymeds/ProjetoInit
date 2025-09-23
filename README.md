## Bem vindo

![Descrição da imagem](./images/image.png)


# 📝 ProjetoInit – To-Do List (Backend + Frontend + Mobile )

Projeto de estudo: backend em Node.js (Fastify, Prisma, JWT) e frontend em React + Vite + TypeScript.  
Inclui **criação e exclusão de tarefas**, **autenticação via JWT**, **criação de usuários**, **criação de grupos com novos membros (via e-mail)** e **tarefas compartilhadas entre usuários do grupo** .  

Cada tarefa esta ligada a seu usuario ou ao grupo que o usuario pertence , tarefas em grupo só podem ser deletadas pelo criador da tarefa (temporariamente) , tarefas podem ser marcadas como concluidas ou pendentes e mostradas na estatistica do dashboard

‼️ **ATENÇÃO**  

- email: `desenvolvedor@dev.com`  
- password: `123456`  

Esse perfil é de membro e não tem tasks ativas para você testar e ver como o sistema está funcionando, caso não queira criar um usuario .  

---

## É sua primeira vez com o projeto? 
 É extremamente necessario usar o npx prisma generate , o Prisma ORM precisa gerar o arquivo do banco de dados , mesmo gerado é bom sempre autualizar com o mesmo comando. 
o projeto apresenta alguns problemas que estão sendo constantemente atualizados. 
 A partir de algumas atualizações o projeto foi alterado par funcionar com o Docker , pois existe uma versão em deploy que utiliza o docker 
porém apenas para fins de estudo e testes o projeto possui uma branch (main) contendo uma versão usando sqlite. 
 Se caso for preciso alterar alguma variavel ambiente , todos os arquivos possui um .env para alterar e rodar sem ter que necessarimente abrir o código , agradeço pela atenção 


 

## 📖 Visão Geral

Arquitetura com separação por camadas (**controllers, use-cases, repositories, middlewares**).  
Backend com **Prisma** para persistência (SQLite por padrão) e **repositórios em memória** para testes.  
Frontend em **React + Vite** com **componentes reutilizáveis**.  

 O front end usa rotas protegidas , devido a isso as camadas de context usam providers próprios no main , é uma forma de como o React permite o roteamento 

---

## ⚡ Tecnologias

**Backend**: Node.js, Fastify, Prisma, Zod, TypeScript, JWT  
**Frontend**: React, Vite, TypeScript, Tailwind / CSS custom  
**Testes**: Vitest  

---

## 📂 Estrutura (resumida)

backend/
└── src/ (controllers, routes, use-cases, repositories, middlewares)
└── app.ts (Fastify + CORS + plugins)

frontend/
└── src/ (components, pages, api, hooks, context)
└── vite.config.ts


---

## 🔧 Instalação (Windows)

### 1. Clonar repositório (raiz do projeto)

```bash
git clone <repo> && cd ProjetoInit

2. Backend
```bash

cd backend
npm install
npx prisma generate
# copiar/ajustar .env a partir de .env.example (defina JWT_SECRET)
npm run dev
```
### 3. Frontend
```bash
cd frontend
npm install
# (opcional) configurar .env VITE_API_URL se backend estiver em outra URL
npm run dev
```
Frontend roda em: http://localhost:5173
Backend roda em: http://localhost:3333
---
🔑 Variáveis de ambiente importantes

Backend (.env)
- DATABASE_URL="file:./dev.db" (SQLite por padrão)
- JWT_SECRET="algumasenha" (defina uma senha segura)
- PORT=3333 (porta do backend)

## Como o Frontend integra com o Backend

Autenticação via JWT:
Após login (POST /sessions) o backend retorna token JWT, armazenado no localStorage.

Todas as requisições autenticadas usam:

Authorization: Bearer <token>


## Endpoints usados no frontend:

GET /todo → listar tarefas

POST /todo → criar tarefa (body: { title: "..." })

DELETE /todo/:id → deletar tarefa



## 📡 Endpoints principais (backend)
Usuários & Sessões

POST /users → criar usuário

POST /sessions → login (retorna JWT)

- Grupos

POST /groups → criar grupo com usuários (via e-mail)

GET /groups/:id → listar grupo e seus membros

- Tarefas

GET /todo → listar tarefas do usuário ou grupo

POST /todo → criar tarefa (aparece para todos do grupo)

DELETE /todo/:id → deletar tarefa

PATCH /todo/:id/complete → marcar como concluída

## 🛠 Notas importantes / Troubleshooting

O projeto esta em protótipo então sua arquitetura esta configurada para lidar com 
baixas restrições no CORS
ou seja temporariamente roda melhor em HTTP e não em HTTPS 

CORS → já configurado no backend com @fastify/cors.

Token ausente (401) → verifique o localStorage.

404 em requests → confirme rotas (/todo, /groups, /users).

Proxy Vite → pode ser usado para evitar CORS.

## 🧪 Testes
Alguns testes estão sendo modificados devido a re-estruturação do backend

Backend:

cd backend
npm run test

# 📱 ProjetoInit – Mobile (React Native + Expo + TypeScript)

Aplicativo mobile para **criação, visualização e gerenciamento de tarefas**, integrado com o backend Node.js (Fastify + Prisma + JWT) do projeto principal.

---

## 📝 Funcionalidades

* Login e autenticação via JWT
* Criação de tarefas individuais ou de grupo
* Listagem de tarefas do usuário e tarefas compartilhadas do grupo
* Marcação de tarefas como concluídas
* Exclusão de tarefas (apenas criador pode deletar tarefas de grupo)
* Dashboard simples com estatísticas de tarefas concluídas e pendentes

---

## ⚡ Tecnologias

**Mobile**: React Native + Expo + TypeScript
**Navegação**: React Navigation (Stack + Drawer)
**Gerenciamento de estado**: Context API
**Armazenamento local**: AsyncStorage (armazenar token JWT)
**Estilização**: Tailwind via `tailwindcss-react-native` ou StyleSheet nativo
**HTTP Requests**: Axios

---

## 📂 Estrutura do Projeto

```
mobile/
├── src/
│   ├── api/          # configuração do Axios e endpoints
│   ├── components/   # componentes reutilizáveis (cards, modais, inputs)
│   ├── context/      # providers para auth e tasks
│   ├── hooks/        # hooks customizados (useTodos, useGroups)
│   ├── screens/      # telas (Login, Dashboard, TaskList, Group)
│   ├── navigation/   # configuração de rotas (Stack e Drawer)
│  
├── App.tsx
└── package.json
```

---

## 🔧 Instalação


### Instalar dependências

```bash

cd TodoMobile

````

```bash

cd todo

````

```bash
npm install
# ou
yarn install
```

###  Rodar o app

* Abrir Expo DevTools:

```bash
npm start
```

* Android:

```bash
npm run android
```

ou

```bash
npm run android
```

* iOS:

```bash
npm run ios
```

* Web (opcional):

```bash
npm run web
```

---

## 🔑 Integração com Backend

### Autenticação via JWT

1. Login (`POST /sessions`) → retorna token JWT
2. Token armazenado em AsyncStorage
3. Todas as requisições autenticadas usam header:

```http
Authorization: Bearer <token>
```

---

### Endpoints consumidos pelo Mobile

**Tarefas**

| Método | Endpoint            | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| GET    | /todo               | Listar tarefas do usuário e grupos |
| POST   | /todo               | Criar tarefa                       |
| PATCH  | /todo/\:id/complete | Marcar como concluída              |
| DELETE | /todo/\:id          | Deletar tarefa (apenas criador)    |

**Usuários & Sessões**

| Método | Endpoint  | Descrição           |
| ------ | --------- | ------------------- |
| POST   | /users    | Criar usuário       |
| POST   | /sessions | Login e retorna JWT |

**Grupos**

| Método | Endpoint     | Descrição                          |
| ------ | ------------ | ---------------------------------- |
| POST   | /groups      | Criar grupo com membros via e-mail |
| GET    | /groups/\:id | Listar grupo e membros             |

---

## 🛠 Notas importantes / Troubleshooting

* React Navigation exige **NavigationContainer** no `App.tsx`
* AsyncStorage usado para persistir token JWT
* Para hot reload funcionar, use `npm start` ou Expo Go
* Certifique-se de que o backend está rodando na mesma rede do emulador ou dispositivo físico

---

## ✅ Funcionalidades implementadas

* Login / Logout
* Cadastro de usuários
* Criação e exclusão de tarefas
* Criação e exclusão de grupos
* Marcação de tarefas como concluídas
* Tarefas de grupo (somente criador pode deletar)
* Dashboard simples com estatísticas

---

## 🛠 Próximos passos

* Dashboard mais completo com gráficos
* Notificações push para tarefas de grupo
* Melhorar UX e responsividade para tablets
* Sincronização offline de tarefas
* Melhoria em tratamento de erros e correções de bugs


## ✅ O que foi implementado
Backend

Fastify + Prisma + JWT

CRUD de tarefas

Criação de usuários

Criação de grupos com usuários via e-mail

Tarefas compartilhadas entre membros do grupo

Frontend

React + Vite + TypeScript

Modal para criação de tarefas

Grid responsivo de tasks

Exclusão otimista com refetch em caso de erro

Exibição de tarefas compartilhadas

## 🛠 Próximos Passos

 Melhorar UI do sistema (UX e responsividade)

 Aumentar cobertura de testes nos use-cases

 Implementar update de tarefas

 Implementar dashboard de admin

✍️ Projeto em constante evolução – feito para estudos e aprendizado!