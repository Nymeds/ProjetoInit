import type { GroupsRepository } from '../../repositories/groups-repository.js';
export declare class ListGroupsUseCase {
    private groupsRepository;
    constructor(groupsRepository: GroupsRepository);
    execute(userId: string): Promise<{
        groups: {
            name: string;
            id: string;
            description: string | null;
            createdAt: Date;
        }[];
    }>;
}
