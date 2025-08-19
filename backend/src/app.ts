import Fastify from "fastify";
import { appRoutes } from "./routes/appRoutes.js";

export const app = Fastify();

app.register(appRoutes)