import type { MessagesRepository } from '../../repositories/messages-repository.js';

export interface UpdateTodoMessageRequest {
  commentId: string;
  authorId: string;
  content: string;
}

export class UpdateTodoMessageUseCase {
  constructor(private messagesRepository: MessagesRepository) {}

  async execute({ commentId, authorId, content }: UpdateTodoMessageRequest) {
    if (!content || !content.trim()) throw new Error('Comentário vazio não é permitido');

    const message = await this.messagesRepository.updateForTodo(commentId, authorId, content.trim());
    return { message };
  }
}
