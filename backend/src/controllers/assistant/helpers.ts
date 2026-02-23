import { z } from "zod";
import { MAX_TEXT_PER_MESSAGE } from "./config.js";

export function toSafeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

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

export function buildErrorId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export function compactText(value: string, maxChars = MAX_TEXT_PER_MESSAGE) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}...`;
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
