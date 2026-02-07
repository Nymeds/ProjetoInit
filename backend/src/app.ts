import Fastify from "fastify";
import { appRoutes } from "./routes/appRoutes.js";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from "./env/index.js";
import cors from '@fastify/cors';
import multipart from "@fastify/multipart";
import { setupSocketHandlers } from './sockets/socket.js';

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


app.register(fastifyCookie);


// register routes
app.register(appRoutes);


app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB global
  },
});

const PORT = Number(process.env.PORT) || 3333;
app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  setupSocketHandlers(app);
  console.log(`Servidor rodando na porta ${PORT}`);
});
