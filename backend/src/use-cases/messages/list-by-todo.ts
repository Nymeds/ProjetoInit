import type { MessagesRepository } from '../../repositories/messages-repository.js';

export class ListTodoMessagesUseCase {
  constructor(private messagesRepository: MessagesRepository) {}

  async execute(todoId: number, kind: 'COMMENT' | 'CHAT' = 'COMMENT') {
    const messages = await this.messagesRepository.listByTodo(todoId, kind);
    return { messages };
  }
}