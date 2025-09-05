import type { GroupsRepository } from '../../repositories/groups-repository.js';

export class ListGroupsUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute(userId: string) {
    const groups = await this.groupsRepository.findManyByUser(userId);
    return { groups };
  }
}
