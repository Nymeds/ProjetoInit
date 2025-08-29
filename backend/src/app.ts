import Fastify from "fastify";
import { appRoutes } from "./routes/appRoutes.js";
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { env } from "./env/index.js";
import cors from '@fastify/cors';

export const app = Fastify()

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
  sign: {
    expiresIn: '10m',
  },
})

await app.register(cors, {
  origin: (origin, cb) => {
    cb(null, true); 
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true,
})

app.register(fastifyCookie)
app.register(appRoutes)