export class ListGroupsUseCase {
    constructor(groupsRepository) {
        this.groupsRepository = groupsRepository;
    }
    async execute(userId) {
        const groups = await this.groupsRepository.findManyByUser(userId);
        return { groups };
    }
}
