import { GoogleGenAI } from "@google/genai";
import { env } from "../../env/index.js";

/**
 * Cliente unico usado por todo o modulo da ELISA para conversar com o provedor
 * de IA. Centralizar essa instancia evita espalhar configuracao e facilita
 * trocar modelo/provedor no futuro.
 */
export const aiClient = new GoogleGenAI({ apiKey: env.IAAPIKEY });
