import Fastify from "fastify";
import { appRoutes } from "./routes/appRoutes.js";
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { env } from "./env/index.js";
import fastifyCors from "@fastify/cors";
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
app.register(fastifyCors, {
  origin: 'http://localhost:5173',
  credentials: true, 
})
app.register(fastifyCookie)
app.register(appRoutes)