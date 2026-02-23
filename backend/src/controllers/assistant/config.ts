export const SYSTEM_INSTRUCTION = `
Voce e a ELISA, assistente de tarefas e grupos.
Regras operacionais:
- Responda sempre em pt-BR, de forma objetiva.
- Para acao de sistema, escolha a ferramenta mais adequada a partir da lista recebida.
- Pode executar multiplas ferramentas na mesma resposta, em ordem.
- Se houver ambiguidade (grupo/tarefa), faca uma pergunta objetiva para desambiguar.
- Em acoes sensiveis (deletar, sair, remover), so execute quando houver confirmacao explicita.
- Se for apenas cumprimento, cumprimente e nao use ferramenta.
`;

export const MODEL_NAME = "gemini-2.5-flash";
export const MAX_CONTEXT_MESSAGES = 12;
export const MAX_GROUP_CONTEXT_MESSAGES = 8;
export const MAX_TOOL_ROUNDS = 5;
export const MAX_TEXT_PER_MESSAGE = 320;
export const MAX_THREAD_CONTEXT_CHARS = 2400;
export const MAX_GROUP_CONTEXT_CHARS = 1400;
export const GROUP_SUMMARY_EVERY_MESSAGES = 10;
export const GROUP_SUMMARY_PREFIX = "GROUP_SUMMARY";
export const ELISA_STATE_PREFIX = "ELISA_STATE";
export const PROACTIVE_TASK_COOLDOWN_MS = 2 * 60 * 1000;
export const PENDING_CONFIRMATION_TTL_MS = 5 * 60 * 1000;
export const PENDING_FOLLOW_UP_TTL_MS = 8 * 60 * 1000;

export const GREETING_PATTERN = /^(oi|ola|bom dia|boa tarde|boa noite|e ai|iae|salve|hey)\b[!. ]*$/i;
export const YES_PATTERN = /^(sim|s|pode|ok|claro|manda|pode sim|confirmo)\b/i;
export const NO_PATTERN = /^(nao|n|deixa|deixa pra la|agora nao)\b/i;

export const INTERNAL_GROUP_ORCHESTRATION_PREFIXES = [
  "O usuario confirmou a execucao de uma tarefa no grupo.",
  "Continuacao de conversa no grupo.",
];
