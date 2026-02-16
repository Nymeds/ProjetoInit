import type { FriendsRepository } from '../../repositories/friends-repository.js';

export class ListAcceptedFriendsUseCase {
  constructor(private friendsRepository: FriendsRepository) {}

  async execute(userId: string) {
    const friends = await this.friendsRepository.listAcceptedByUser(userId);
    return { friends };
  }
}
