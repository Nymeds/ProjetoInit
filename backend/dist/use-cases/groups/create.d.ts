import type { GroupsRepository } from "../../repositories/groups-repository.js";
import type { UsersRepository } from "../../repositories/users-repository.js";
export interface CreateGroupRequest {
    name: string;
    description?: string;
    userEmails: string[];
}
export declare class CreateGroupUseCase {
    private groupsRepository;
    private usersRepository;
    constructor(groupsRepository: GroupsRepository, usersRepository: UsersRepository);
    execute({ name, description, userEmails }: CreateGroupRequest): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
    }>;
}
