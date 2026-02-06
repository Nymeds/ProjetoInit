import type { MessagesRepository } from '../../repositories/messages-repository.js';

export interface DeleteTodoMessageRequest {
  commentId: string;
  authorId: string;
}

export class DeleteTodoMessageUseCase {
  constructor(private messagesRepository: MessagesRepository) {}

  async execute({ commentId, authorId }: DeleteTodoMessageRequest) {
    await this.messagesRepository.delete(commentId, authorId);
    return {};
  }
}
