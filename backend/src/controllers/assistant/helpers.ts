import { z } from "zod";
import { MAX_TEXT_PER_MESSAGE } from "./config.js";

/**
 * Converte qualquer valor para um formato serializavel sem quebrar logs.
 * E usado principalmente em tratamento de erro e auditoria.
 */
export function toSafeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

/**
 * Normaliza erros para um objeto consistente, incluindo detalhes do Zod
 * quando a falha aconteceu em validacao de schema.
 */
export function extractErrorDetails(err: unknown) {
  if (err instanceof z.ZodError) {
    return {
      type: "ZodError",
      message: err.message,
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    };
  }

  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    type: "UnknownError",
    value: toSafeJson(err),
  };
}

/**
 * Gera um identificador unico e facil de rastrear em logs e respostas HTTP.
 */
export function buildErrorId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

/**
 * Compacta texto removendo espacos redundantes e cortando excesso de tamanho.
 * Isso reduz tokens enviados ao modelo e deixa historico mais barato.
 */
export function compactText(value: string, maxChars = MAX_TEXT_PER_MESSAGE) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}...`;
}

/**
 * Normaliza strings para comparacoes tolerantes a acentos, maiusculas e espacos.
 * Essa funcao e a base de varias buscas "fuzzy" por grupo e tarefa.
 */
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
