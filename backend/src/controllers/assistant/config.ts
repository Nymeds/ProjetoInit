/**
 * Prompt de sistema base da ELISA.
 * Ele define personalidade, limites de seguranca e como o modelo deve se
 * comportar antes de receber o contexto dinamico montado em runtime.
 */
export const SYSTEM_INSTRUCTION = `
Voce e a ELISA, assistente operacional da equipe e do projeto.
Regras operacionais:
- Responda sempre em pt-BR, de forma objetiva, colaborativa e confiavel.
- Considere o contexto operacional recebido nesta rodada antes de interpretar a mensagem atual.
- Para acao de sistema, escolha a ferramenta mais adequada dentre as ferramentas expostas nesta rodada.
- Pode executar multiplas ferramentas em ordem quando isso reduzir atrito para o usuario.
- Quando a mensagem for curta ou continuação (ex.: "sim", "esse", "o do financeiro"), trate como resposta a pendencia mais recente se houver contexto suficiente.
- Se houver ambiguidade real (grupo, tarefa, membro, comentario), faca uma unica pergunta curta para desambiguar.
- Em acoes sensiveis (deletar, sair, remover), so execute com confirmacao explicita.
- Se o usuario pedir ajuda para organizar projeto, equipe, prioridades ou proximos passos sem uma acao de sistema clara, responda com orientacao curta e pratica, sem inventar dados.
- Nunca invente tarefas, grupos, ids, membros, historicos ou resultados de ferramentas.
- Se for apenas cumprimento, cumprimente e nao use ferramenta.
`;

// Modelo principal usado nas chamadas ao provedor de IA.
export const MODEL_NAME = "gemini-2.5-flash";

// Quantidade maxima de mensagens reaproveitadas do historico persistido.
export const MAX_CONTEXT_MESSAGES = 8;

// Limite separado para fluxos dentro de grupos/chat em tempo real.
export const MAX_GROUP_CONTEXT_MESSAGES = 8;

// Numero maximo de rodadas "modelo -> ferramenta -> modelo" por requisicao.
export const MAX_TOOL_ROUNDS = 5;

// Tamanho maximo por mensagem apos compactacao.
export const MAX_TEXT_PER_MESSAGE = 220;

// Orcamento total de caracteres reaproveitados do historico da thread.
export const MAX_THREAD_CONTEXT_CHARS = 1800;
export const MAX_GROUP_CONTEXT_CHARS = 1400;

// Parametros reservados para futuras memorias e resumos de conversas em grupo.
export const GROUP_SUMMARY_EVERY_MESSAGES = 10;
export const GROUP_SUMMARY_PREFIX = "GROUP_SUMMARY|";
export const ELISA_STATE_PREFIX = "ELISA_STATE|";
export const PROACTIVE_TASK_COOLDOWN_MS = 2 * 60 * 1000;
export const PENDING_CONFIRMATION_TTL_MS = 5 * 60 * 1000;
export const PENDING_FOLLOW_UP_TTL_MS = 8 * 60 * 1000;

// Padroes linguisticos usados para identificar saudacoes e respostas curtas.
export const GREETING_PATTERN = /^(oi|ola|bom dia|boa tarde|boa noite|e ai|iae|salve|hey)\b[!. ]*$/i;
export const YES_PATTERN = /^(sim|s|pode|ok|claro|manda|pode sim|confirmo)\b/i;
export const NO_PATTERN = /^(nao|n|deixa|deixa pra la|agora nao)\b/i;

// Prefixos internos que nao devem aparecer como historico normal ao usuario.
export const INTERNAL_GROUP_ORCHESTRATION_PREFIXES = [
  "O usuario confirmou a execucao de uma tarefa no grupo.",
  "Continuacao de conversa no grupo.",
];
