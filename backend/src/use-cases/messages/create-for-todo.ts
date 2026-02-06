import type { MessagesRepository } from '../../repositories/messages-repository.js';

export interface CreateTodoMessageRequest {
  todoId: number;
  authorId: string;
  content: string;
  kind?: 'COMMENT' | 'CHAT';
}

export class CreateTodoMessageUseCase {
  constructor(private messagesRepository: MessagesRepository) {}

  async execute({ todoId, authorId, content, kind = 'COMMENT' }: CreateTodoMessageRequest) {
    if (!content || !content.trim()) throw new Error('Comentário vazio não é permitido');

    const message = await this.messagesRepository.createForTodo(todoId, authorId, content.trim(), kind);
    return { message };
  }
}