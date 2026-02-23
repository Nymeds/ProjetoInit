import { GoogleGenAI } from "@google/genai";
import { env } from "../../env/index.js";

export const aiClient = new GoogleGenAI({ apiKey: env.IAAPIKEY });
