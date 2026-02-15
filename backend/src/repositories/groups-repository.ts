import type { Group } from "@prisma/client";

export interface CreateGroupParams {
  name: string;
  description?: string | null;
  userEmails: string[];
}

export interface GroupsRepository {
  delete(arg0: { id: string }): Promise<Group>;
  findByName(name: string): Promise<Group | null>;
  create(data: CreateGroupParams): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findAll(): Promise<Group[]>;
  findManyByUser(userId: string): Promise<Group[]>;
  addMember?(groupId: string, userEmail: string): Promise<unknown>;
  removeMember(groupId: string, userId: string): Promise<void>;
  update(
    id: string,
    data: { name?: string; description?: string | null }
  ): Promise<Group>;

}
