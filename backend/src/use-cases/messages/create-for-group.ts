import type { MessagesRepository } from '../../repositories/messages-repository.js';

export interface CreateGroupMessageRequest {
  groupId: string;
  authorId: string;
  content: string;
}

export class CreateGroupMessageUseCase {
  constructor(private messagesRepository: MessagesRepository) {}

  async execute({ groupId, authorId, content }: CreateGroupMessageRequest) {
    if (!content || !content.trim()) throw new Error('Mensagem vazia não é permitida');

    const message = await this.messagesRepository.createForGroup(groupId, authorId, content.trim());
    return { message };
  }
}