export interface ToolCandidate {
  id: number | string;
  title?: string;
  name?: string;
  group?: string | null;
}

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

export type ToolResult = {
  ok: boolean;
  error?: string;
  errorId?: string;
  candidates?: ToolCandidate[];
  [key: string]: unknown;
};

export type ToolFailure = {
  tool: string;
  args: unknown;
  result: ToolResult;
};

export interface AssistantRuntimeContext {
  sourceGroupId?: string;
  preferredGroupId?: string;
  preferredGroupName?: string;
  rawUserMessage: string;
  recentUserMessages: string[];
}

export interface AssistantProcessParams {
  userId: string;
  message: string;
  sourceGroupId?: string;
  autoPostToSourceGroup?: boolean;
  skipThreadHistory?: boolean;
  persistInAssistantHistory?: boolean;
  io?: any;
}
