import type { MessagesRepository } from '../../repositories/messages-repository.js';

export class ListGroupMessagesUseCase {
  constructor(private messagesRepository: MessagesRepository) {}

  async execute(groupId: string) {
    const messages = await this.messagesRepository.listByGroup(groupId);
    return { messages };
  }
}