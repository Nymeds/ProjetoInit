import Fastify from "fastify";
import { appRoutes } from "./routes/appRoutes.js";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from "./env/index.js";
import cors from '@fastify/cors';

export const app = Fastify();

// JWT
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
  sign: {
    expiresIn: '10m',
  },
});

// CORS
const allowedOrigins = [
  'http://localhost:5173', 
  'https://projetoinit.onrender.com', 
];

await app.register(cors, {
  origin: (origin, cb) => {
    // permitir requisições sem origin (ex: Postman)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true,
});

// Cookies
app.register(fastifyCookie);

// Rotas
app.register(appRoutes);

// Server (pode definir a porta dinamicamente para Render)
const PORT = Number(process.env.PORT) || 3333;
app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
