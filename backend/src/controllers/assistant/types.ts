/**
 * Estrutura minima usada para apresentar opcoes ao usuario quando ha
 * ambiguidade entre tarefas, grupos ou comentarios.
 */
export interface ToolCandidate {
  id: number | string;
  title?: string;
  name?: string;
  group?: string | null;
}

/**
 * Estado interno leve salvo junto da thread para que a ELISA consiga entender
 * continuacoes como "sim", "esse" ou "o do financeiro" sem depender apenas do
 * historico textual visivel.
 */
export interface AssistantConversationState {
  status: "idle" | "pending";
  kind?: "confirmation" | "clarification";
  toolNames?: string[];
  assistantPrompt?: string;
  previousUserMessage?: string;
  args?: Record<string, unknown>;
  candidates?: ToolCandidate[];
  sourceGroupId?: string;
  createdAt: string;
}

/**
 * Eventos de dominio disparados pela assistente durante uma requisicao.
 * Eles servem tanto para logging quanto para UI e integracoes futuras.
 */
export type AssistantAction =
  | { type: "task_created"; id: number }
  | { type: "task_completed"; id: number }
  | { type: "task_updated"; id: number }
  | { type: "task_moved"; id: number; groupId: string | null }
  | { type: "task_deleted"; id: number }
  | { type: "group_created"; id: string }
  | { type: "group_updated"; id: string }
  | { type: "group_deleted"; id: string }
  | { type: "group_left"; id: string }
  | { type: "group_message_sent"; id: string; groupId: string }
  | { type: "todo_message_created"; id: string; todoId: number }
  | { type: "todo_message_updated"; id: string; todoId?: number }
  | { type: "todo_message_deleted"; id: string; todoId?: number };

/**
 * Contrato padrao de retorno das ferramentas. O modelo nao conhece repositorios
 * nem banco; ele enxerga apenas esse resultado normalizado.
 */
export type ToolResult = {
  ok: boolean;
  error?: string;
  errorId?: string;
  candidates?: ToolCandidate[];
  [key: string]: unknown;
};

/**
 * Objeto usado quando uma ferramenta falha e a ELISA precisa transformar essa
 * falha em uma pergunta curta ou mensagem de reorientacao.
 */
export type ToolFailure = {
  tool: string;
  args: unknown;
  result: ToolResult;
};

/**
 * Contexto sintetico que acompanha a rodada atual de interpretacao.
 * Ele junta contexto de grupo, sinais recentes do usuario e possiveis pendencias.
 */
export interface AssistantRuntimeContext {
  sourceGroupId?: string;
  preferredGroupId?: string;
  preferredGroupName?: string;
  rawUserMessage: string;
  recentUserMessages: string[];
  interactionSignals: string[];
  followUpHint?: string;
  contextSummary?: string;
  suggestedToolNames: string[];
  pendingState?: AssistantConversationState | null;
}

/**
 * Payload de entrada do pipeline principal da ELISA.
 * O mesmo fluxo e reaproveitado para chat direto e mencoes em grupo.
 */
export interface AssistantProcessParams {
  userId: string;
  message: string;
  sourceGroupId?: string;
  autoPostToSourceGroup?: boolean;
  skipThreadHistory?: boolean;
  persistInAssistantHistory?: boolean;
  io?: any;
}
