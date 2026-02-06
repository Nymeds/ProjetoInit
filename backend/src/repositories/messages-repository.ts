export type Message = {
  id: string;
  content: string;
  createdAt: Date;
  kind: 'COMMENT' | 'CHAT' | 'GROUP';
  authorId: string;
  authorName?: string | null;
  groupId?: string | null;
  todoId?: number | null;
};

export interface MessagesRepository {
  listByGroup(groupId: string): Promise<Message[]>;
  createForGroup(groupId: string, authorId: string, content: string): Promise<Message>;

  listByTodo(todoId: number, kind?: 'COMMENT' | 'CHAT'): Promise<Message[]>;
  createForTodo(todoId: number, authorId: string, content: string, kind?: 'COMMENT' | 'CHAT'): Promise<Message>;

  // editing / deleting comments
  updateForTodo(commentId: string, authorId: string, content: string): Promise<Message>;
  delete(commentId: string, authorId: string): Promise<void>;
}