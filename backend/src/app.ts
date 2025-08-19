import Fastify from "fastify";
import { appRoutes } from "./appRoutes.js";

export const app = Fastify();

app.register(appRoutes)