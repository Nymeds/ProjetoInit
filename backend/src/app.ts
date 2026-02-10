import Fastify from "fastify";
import path from "node:path";
import fs from "node:fs";
import { appRoutes } from "./routes/appRoutes.js";
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { env } from "./env/index.js";
import cors from '@fastify/cors';
import multipart from "@fastify/multipart";
import { setupSocketHandlers } from './sockets/socket.js';

export const app = Fastify();

app.register(fastifyCookie);

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
  'http://localhost:5174',
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

app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB global
  },
  attachFieldsToBody: true,
});

app.get('/uploads/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  const safeName = path.basename(filename);
  const filePath = path.resolve('uploads', safeName);

  if (!fs.existsSync(filePath)) {
    return reply.status(404).send({ message: 'Arquivo não encontrado' });
  }

  const ext = path.extname(safeName).toLowerCase();
  const mimeByExt: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  reply.type(mimeByExt[ext] || 'application/octet-stream');
  return reply.send(fs.createReadStream(filePath));
});

// register routes
app.register(appRoutes);

const PORT = Number(process.env.PORT) || 3333;
app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  setupSocketHandlers(app);
  console.log(`Servidor rodando na porta ${PORT}`);
});
