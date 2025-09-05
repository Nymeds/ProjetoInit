import type { GroupsRepository, CreateGroupParams } from "../groups-repository.js";
import type { Group } from "@prisma/client";
export declare class PrismaGroupsRepository implements GroupsRepository {
    create({ name, description, userEmails }: CreateGroupParams): Promise<Group>;
    delete({ id }: {
        id: string;
    }): Promise<Group>;
    addMember(groupId: string, userEmail: string): Promise<{
        userId: string;
        groupId: string;
        roleInGroup: import("@prisma/client").$Enums.Role | null;
    }>;
    findById(id: string): Promise<Group | null>;
    findAll(): Promise<Group[]>;
    findByName(name: string): Promise<Group | null>;
    findManyByUser(userId: string): Promise<Group[]>;
}
