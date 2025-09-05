import type { GroupsRepository } from "../../repositories/groups-repository.js";
export interface DeleteGroupRequest {
    id: string;
}
export declare class DeleteGroupUseCase {
    private groupsRepository;
    constructor(groupsRepository: GroupsRepository);
    execute({ id }: DeleteGroupRequest): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
    }>;
}
