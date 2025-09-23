import Fastify from "fastify";
import { appRoutes } from "./routes/appRoutes.js";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from "./env/index.js";
import cors from '@fastify/cors';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.register(fastifyCookie);

// Rotas da API
app.register(appRoutes);
// @ts-ignore

app.register(import('@fastify/static'), {
  root: path.join(__dirname, "../frontend/dist"),
  prefix: "/", 
});


app.setNotFoundHandler((req, reply) => {
  reply.sendFile("index.html");
});
